import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDirectory = path.join(root, "data");
const outputPath = path.join(root, "public", "data", "activity.json");

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: options.encoding,
      input: options.input,
      maxBuffer: options.maxBuffer ?? 128 * 1024 * 1024,
      stdio: options.encoding ? ["ignore", "pipe", "ignore"] : undefined,
    });
  } catch {
    return options.encoding ? "" : Buffer.alloc(0);
  }
}

const historyText = runGit(
  ["log", "--reverse", "--format=%H%x1f%P%x1f%cI", "--name-only", "--", "data"],
  { encoding: "utf8" },
);
const commits = [];
let currentCommit;

for (const line of historyText.split(/\r?\n/)) {
  if (line.includes("\x1f")) {
    const fields = line.split("\x1f");
    const parents = (fields[1] ?? "").trim().split(/\s+/);
    currentCommit = {
      hash: fields[0],
      parent: parents[0] || null,
      timestamp: fields[2],
      files: new Set(),
    };
    commits.push(currentCommit);
  } else if (line.trim() && currentCommit) {
    currentCommit.files.add(line.trim().replaceAll("\\", "/"));
  }
}

const objectSpecs = new Set();
for (const commit of commits) {
  if (!commit.parent) continue;
  const dataFiles = Array.from(commit.files).filter(
    (file) => file.startsWith("data/") && file.endsWith(".json"),
  );
  if (!dataFiles.length) continue;

  objectSpecs.add(commit.hash + ":data/_list.json");
  for (const file of dataFiles) {
    objectSpecs.add(commit.hash + ":" + file);
    objectSpecs.add(commit.parent + ":" + file);
  }
  if (dataFiles.includes("data/_list.json")) {
    objectSpecs.add(commit.parent + ":data/_list.json");
  }
}

const specList = Array.from(objectSpecs);
const objectCache = new Map();
if (specList.length > 0) {
  const response = runGit(["cat-file", "--batch"], {
    input: specList.join("\n") + "\n",
    maxBuffer: 256 * 1024 * 1024,
  });
  let offset = 0;

  for (const spec of specList) {
    const headerEnd = response.indexOf(10, offset);
    if (headerEnd < 0) break;

    const header = response.subarray(offset, headerEnd).toString("utf8");
    offset = headerEnd + 1;

    if (header.endsWith(" missing")) {
      objectCache.set(spec, null);
      continue;
    }

    const size = Number(header.split(" ").at(-1));
    const content = response.subarray(offset, offset + size).toString("utf8");
    objectCache.set(spec, content);
    offset += size + 1;
  }
}

function listAt(revision) {
  const raw = objectCache.get(revision + ":data/_list.json");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const levelInfoById = new Map();
for (const filename of fs.readdirSync(dataDirectory)) {
  if (!filename.toLowerCase().endsWith(".json") || filename.startsWith("_")) continue;

  const id = filename.slice(0, -5);
  try {
    const level = JSON.parse(
      fs.readFileSync(path.join(dataDirectory, filename), "utf8"),
    );
    levelInfoById.set(id, {
      name: typeof level.name === "string" && level.name ? level.name : id,
      href:
        typeof level.showcase === "string" && level.showcase
          ? level.showcase
          : typeof level.verification === "string" && level.verification
            ? level.verification
            : undefined,
    });
  } catch {
    levelInfoById.set(id, { name: id });
  }
}

function levelInfo(id) {
  return levelInfoById.get(id) ?? { name: id };
}

function neighborAt(ids, index) {
  if (index < 0 || index >= ids.length) return undefined;
  const info = levelInfo(ids[index]);
  return { name: info.name, ...(info.href ? { href: info.href } : {}) };
}

function baseEvent(timestamp, id, rank) {
  const info = levelInfo(id);
  return {
    timestamp,
    levelId: id,
    levelName: info.name,
    ...(info.href ? { levelHref: info.href } : {}),
    rank,
  };
}

function parseRecords(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

function recordKey(record) {
  return JSON.stringify([
    String(record.user ?? "").toLowerCase(),
    String(record.link ?? ""),
    String(record.percent ?? ""),
    String(record.hz ?? ""),
    Boolean(record.mobile),
  ]);
}

const changelog = [];
const achievements = [];

for (const commit of commits) {
  if (!commit.parent) continue;
  const files = Array.from(commit.files).filter(
    (file) => file.startsWith("data/") && file.endsWith(".json"),
  );
  if (!files.length) continue;

  if (files.includes("data/_list.json")) {
    const before = listAt(commit.parent);
    const after = listAt(commit.hash);
    const beforeRanks = new Map(before.map((id, index) => [id, index + 1]));
    after.forEach((id, index) => {
      const rank = index + 1;
      const previousRank = beforeRanks.get(id);
      const above = neighborAt(after, index - 1);
      const below = neighborAt(after, index + 1);

      if (previousRank === undefined) {
        changelog.push({
          type: "placement",
          ...baseEvent(commit.timestamp, id, rank),
          ...(above ? { above } : {}),
          ...(below ? { below } : {}),
        });
        if (rank <= 25) {
          achievements.push({
            type: "verification",
            ...baseEvent(commit.timestamp, id, rank),
          });
        }
      } else if (previousRank !== rank) {
        const rankMoversAbove = after
          .slice(0, index)
          .filter((aboveId) => {
            const oldRank = beforeRanks.get(aboveId);
            const newRank = after.indexOf(aboveId) + 1;
            return (
              oldRank === undefined ||
              (newRank < oldRank && oldRank > previousRank)
            );
          }).length;

        // New placements and existing levels moving up from below can both
        // push this level to a larger rank number.
        if (rank > previousRank && rank - previousRank === rankMoversAbove) {
          return;
        }

        changelog.push({
          type: "rank-change",
          ...baseEvent(commit.timestamp, id, rank),
          previousRank,
          ...(above ? { above } : {}),
          ...(below ? { below } : {}),
        });
      }
    });
  }

  const rankedList = listAt(commit.hash);
  const ranks = new Map(rankedList.map((id, index) => [id, index + 1]));

  for (const file of files) {
    if (file === "data/_list.json") continue;
    const id = file.slice("data/".length, -".json".length);
    const rank = ranks.get(id);
    if (rank === undefined || rank > 25) continue;

    const beforeRaw = objectCache.get(commit.parent + ":" + file);
    const afterRaw = objectCache.get(commit.hash + ":" + file);
    if (beforeRaw == null || afterRaw == null) continue;

    const beforeRecords = parseRecords(beforeRaw);
    const counts = new Map();
    for (const record of beforeRecords) {
      const key = recordKey(record);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const record of parseRecords(afterRaw)) {
      const key = recordKey(record);
      const count = counts.get(key) ?? 0;
      if (count > 0) {
        counts.set(key, count - 1);
        continue;
      }

      achievements.push({
        type: "completion",
        ...baseEvent(commit.timestamp, id, rank),
        ...(typeof record.user === "string" ? { user: record.user } : {}),
        ...(Number.isFinite(Number(record.percent))
          ? { percent: Number(record.percent) }
          : {}),
        ...(typeof record.link === "string" && record.link
          ? { recordHref: record.link }
          : {}),
      });
    }
  }
}

function compareNewestFirst(a, b) {
  const difference =
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  if (difference !== 0) return difference;

  const priority = (event) =>
    event.type === "placement" || event.type === "verification" ? 0 : 1;
  return priority(a) - priority(b);
}

const activity = {
  changelog: changelog.sort(compareNewestFirst).slice(0, 30),
  achievements: achievements.sort(compareNewestFirst).slice(0, 30),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(activity, null, 2) + "\n", "utf8");
console.log(
  "Generated activity feed: " +
    activity.changelog.length +
    " changes, " +
    activity.achievements.length +
    " achievements.",
);
