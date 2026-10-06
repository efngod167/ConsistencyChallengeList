/**
 * Data layer for CCL.
 * Mirrors the original site's behaviour 1:1 — same `/data` JSON files,
 * same scoring formula, same leaderboard aggregation.
 */

const dir = `${import.meta.env.BASE_URL}data`;
const scale = 3;

export type Record_ = {
  user: string;
  link: string;
  hz?: string;
  percent: number;
  mobile?: boolean;
};

export type Level = {
  id: string;
  name: string;
  author: string;
  creators: string[];
  verifier: string;
  verification: string;
  showcase?: string;
  percentToQualify: string | number;
  fps?: string;
  version?: string;
  CBF?: string;
  alternating?: string;
  records: Record_[];
  path?: string;
};

export type ListEntry = [Level | null, string | null];

export type Editor = { role: string; name: string; link?: string };

export type Pack = { name: string; color: string; levels: Array<string | number> };

export function round(num: number): number {
  if (!("" + num).includes("e")) {
    return +(Math.round(Number(num + "e+" + scale)) + "e-" + scale);
  }
  const arr = ("" + num).split("e");
  const mantissa = Number(arr[0] ?? 0);
  const exponent = Number(arr[1] ?? 0);
  const sig = exponent + scale > 0 ? "+" : "";
  return +(
    Math.round(Number(mantissa + "e" + sig + (exponent + scale))) + "e-" + scale
  );
}

export function score(
  rank: number,
  percent: number,
  minPercent: number | string,
): number {
  if (rank > 200) return 0;
  const min = Number(minPercent);

  let value =
    (-22.75 * Math.pow(rank - 1, 0.4) + 200) *
    ((percent - (min - 1)) / (100 - (min - 1)));

  value = Math.max(0, value);

  if (percent !== 100) return round(value - value / 3);
  return Math.max(round(value), 0);
}

export function getYoutubeIdFromUrl(url: string): string {
  return (
    url.match(/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/)?.[1] ??
    ""
  );
}

export function embed(video: string): string {
  if (video.includes("medal.tv")) return video;
  return `https://www.youtube.com/embed/${getYoutubeIdFromUrl(video)}`;
}

export function localize(num: number): string {
  return num.toLocaleString(undefined, { minimumFractionDigits: 3 });
}

export function getThumbnailFromId(id: string): string {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    const tmp = array[currentIndex] as T;
    array[currentIndex] = array[randomIndex] as T;
    array[randomIndex] = tmp;
  }
  return array;
}

export async function fetchList(): Promise<ListEntry[]> {
  const listResult = await fetch(`${dir}/_list.json`);
  const list: string[] = await listResult.json();
  return await Promise.all(
    list.map(async (path, rank): Promise<ListEntry> => {
      try {
        const levelResult = await fetch(`${dir}/${path}.json`);
        const level: Level = await levelResult.json();
        return [
          {
            ...level,
            path,
            records: [...(level.records ?? [])].sort(
              (a, b) => b.percent - a.percent,
            ),
          },
          null,
        ];
      } catch {
        console.error(`Failed to load level #${rank + 1} ${path}.`);
        return [null, path];
      }
    }),
  );
}

export async function fetchEditors(): Promise<Editor[] | null> {
  try {
    const res = await fetch(`${dir}/_editors.json`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPacks(): Promise<Pack[]> {
  const res = await fetch(`${dir}/_packs.json`);
  return await res.json();
}

export type Score = {
  rank: number;
  level: string;
  score: number;
  link: string;
  percent?: number;
};

export type LeaderboardEntry = {
  user: string;
  total: number;
  verified: Score[];
  completed: Score[];
  progressed: Score[];
};

export async function fetchLeaderboard(): Promise<[LeaderboardEntry[], string[]]> {
  const list = await fetchList();

  type Bucket = { verified: Score[]; completed: Score[]; progressed: Score[] };
  const scoreMap: Record<string, Bucket> = {};
  const errs: string[] = [];

  list.forEach(([level, err], rank) => {
    if (err || !level) {
      if (err) errs.push(err);
      return;
    }

    const verifier =
      Object.keys(scoreMap).find(
        (u) => u.toLowerCase() === level.verifier.toLowerCase(),
      ) || level.verifier;
    scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
    scoreMap[verifier].verified.push({
      rank: rank + 1,
      level: level.name,
      score: score(rank + 1, 100, level.percentToQualify),
      link: level.verification,
    });

    level.records.forEach((record) => {
      const user =
        Object.keys(scoreMap).find(
          (u) => u.toLowerCase() === record.user.toLowerCase(),
        ) || record.user;
      scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
      const { completed, progressed } = scoreMap[user];
      if (record.percent === 100) {
        completed.push({
          rank: rank + 1,
          level: level.name,
          score: score(rank + 1, 100, level.percentToQualify),
          link: record.link,
        });
        return;
      }
      progressed.push({
        rank: rank + 1,
        level: level.name,
        percent: record.percent,
        score: score(rank + 1, record.percent, level.percentToQualify),
        link: record.link,
      });
    });
  });

  const res: LeaderboardEntry[] = Object.entries(scoreMap).map(
    ([user, scores]) => {
      const total = [scores.verified, scores.completed, scores.progressed]
        .flat()
        .reduce((prev, cur) => prev + cur.score, 0);
      return { user, total: round(total), ...scores };
    },
  );

  return [res.sort((a, b) => b.total - a.total), errs];
}
