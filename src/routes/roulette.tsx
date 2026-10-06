import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { Page, Spinner } from "@/components/Shell";
import {
  fetchList,
  getThumbnailFromId,
  getYoutubeIdFromUrl,
  shuffle,
} from "@/lib/list";

export const Route = createFileRoute("/roulette")({
  head: () => ({
    meta: [
      { title: "Challenge Roulette — CCL" },
      { property: "og:title", content: "Challenge Roulette — CCL" },
    ],
  }),
  component: RoulettePage,
});

type RouletteLevel = { rank: number; id: string; name: string; video: string };

function Btn({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2.5 text-xs font-bold tracking-widest text-primary-foreground uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger" ? "bg-destructive" : "bg-primary"
      }`}
    >
      {children}
    </button>
  );
}

function RoulettePage() {
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState<RouletteLevel[]>([]);
  const [progression, setProgression] = useState<number[]>([]);
  const [percentage, setPercentage] = useState("");
  const [givenUp, setGivenUp] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [useMainList, setUseMainList] = useState(true);
  const [useExtendedList, setUseExtendedList] = useState(true);
  const [toasts, setToasts] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("roulette") ?? "null");
      if (saved?.levels && saved?.progression) {
        setLevels(saved.levels);
        setProgression(saved.progression);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const currentLevel = levels[progression.length];
  const currentPercentage = progression[progression.length - 1] || 0;
  const hasCompleted =
    currentPercentage >= 100 ||
    (levels.length > 0 && progression.length === levels.length);
  const isActive = progression.length > 0 && !givenUp && !hasCompleted;

  const remaining = useMemo(
    () =>
      levels.slice(
        progression.length + 1,
        levels.length - currentPercentage + progression.length,
      ),
    [levels, progression.length, currentPercentage],
  );

  function showToast(msg: string) {
    setToasts((t) => [...t, msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 3000);
  }

  function save(nextLevels: RouletteLevel[], nextProgression: number[]) {
    localStorage.setItem(
      "roulette",
      JSON.stringify({ levels: nextLevels, progression: nextProgression }),
    );
  }

  async function onStart() {
    if (isActive) {
      showToast("Give up before starting a new roulette.");
      return;
    }
    if (!useMainList && !useExtendedList) return;

    setLoading(true);
    const fullList = await fetchList();
    if (fullList.filter(([, err]) => err).length > 0) {
      setLoading(false);
      showToast("List is currently broken. Wait until it's fixed to start a roulette.");
      return;
    }

    const mapped: RouletteLevel[] = fullList.map(([lvl], i) => ({
      rank: i + 1,
      id: String(lvl?.id ?? ""),
      name: lvl?.name ?? "",
      video: lvl?.verification ?? "",
    }));

    const pool: RouletteLevel[] = [];
    if (useMainList) pool.push(...mapped.slice(0, 75));
    if (useExtendedList) pool.push(...mapped.slice(75, 150));

    setLevels(shuffle(pool).slice(0, 100));
    setShowRemaining(false);
    setGivenUp(false);
    setProgression([]);
    setPercentage("");
    setLoading(false);
  }

  function onDone() {
    const value = Number(percentage);
    if (!percentage || Number.isNaN(value)) return;
    if (value <= currentPercentage || value > 100) {
      showToast("Invalid percentage.");
      return;
    }
    const next = [...progression, value];
    setProgression(next);
    setPercentage("");
    save(levels, next);
  }

  function onGiveUp() {
    setGivenUp(true);
    localStorage.removeItem("roulette");
  }

  function onImport() {
    if (
      isActive &&
      !window.confirm("This will overwrite the currently running roulette. Continue?")
    ) {
      return;
    }
    fileInput.current?.click();
  }

  async function onImportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (!saved.levels || !saved.progression) {
        showToast("Invalid file.");
        return;
      }
      setLevels(saved.levels);
      setProgression(saved.progression);
      save(saved.levels, saved.progression);
      setGivenUp(false);
      setShowRemaining(false);
      setPercentage("");
    } catch {
      showToast("Invalid file.");
    }
  }

  function onExport() {
    const file = new Blob([JSON.stringify({ levels, progression })], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = "tsl_roulette";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function LevelCard({
    level,
    trailing,
    children,
  }: {
    level: RouletteLevel;
    trailing?: React.ReactNode;
    children?: React.ReactNode;
  }) {
    return (
      <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <a
          href={level.video}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 overflow-hidden rounded-2xl border border-cyan-500/15"
        >
          <img
            src={getThumbnailFromId(getYoutubeIdFromUrl(level.video))}
            alt={level.name}
            className="h-24 w-40 object-cover"
          />
        </a>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">#{level.rank}</p>
          <h2 className="truncate text-lg font-semibold">{level.name}</h2>
          {trailing}
        </div>
        {children}
      </div>
    );
  }

  return (
    <Page>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="panel h-fit space-y-5 p-5 lg:sticky lg:top-20">
          <p className="text-xs text-muted-foreground">
            Shameless copy of the Extreme Demon Roulette by{" "}
            <a
              href="https://matcool.github.io/extreme-demon-roulette/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              matcool
            </a>
            .
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useMainList}
                onChange={(e) => setUseMainList(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              Main List
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useExtendedList}
                onChange={(e) => setUseExtendedList(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              Extended List
            </label>
            <Btn onClick={onStart}>{levels.length === 0 ? "Start" : "Restart"}</Btn>
          </div>

          <p className="text-xs text-muted-foreground">
            The roulette saves automatically.
          </p>

          <div className="space-y-2">
            <p className="eyebrow">Manual Load/Save</p>
            <div className="flex gap-2">
              <Btn onClick={onImport}>Import</Btn>
              <Btn onClick={onExport} disabled={!isActive}>
                Export
              </Btn>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".json"
              className="hidden"
              onChange={onImportUpload}
            />
          </div>
        </aside>

        <section className="space-y-4">
          {loading && <Spinner />}

          {levels.slice(0, progression.length).map((level, i) => (
            <LevelCard
              key={`${level.id}-done-${i}`}
              level={level}
              trailing={
                <p className="mt-1 text-sm font-bold text-success">
                  {progression[i]}%
                </p>
              }
            />
          ))}

          {levels.length > 0 && !hasCompleted && currentLevel && (
            <LevelCard
              level={currentLevel}
              trailing={
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentLevel.id}
                </p>
              }
            >
              {!givenUp && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder={`At least ${currentPercentage + 1}%`}
                    min={currentPercentage + 1}
                    max={100}
                    className="w-36 rounded-xl border border-cyan-500/15 bg-background/60 px-3 py-2 text-sm outline-none focus:border-ring"
                  />
                  <Btn onClick={onDone}>Done</Btn>
                  <Btn onClick={onGiveUp} tone="danger">
                    Give Up
                  </Btn>
                </div>
              )}
            </LevelCard>
          )}

          {levels.length > 0 && (givenUp || hasCompleted) && (
            <div className="panel space-y-2 p-6">
              <h1 className="text-2xl font-semibold">Results</h1>
              <p className="text-sm text-muted-foreground">
                Number of levels: {progression.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Highest percent: {currentPercentage}%
              </p>
              {currentPercentage < 99 && !hasCompleted && (
                <Btn onClick={() => setShowRemaining(true)}>
                  Show remaining levels
                </Btn>
              )}
            </div>
          )}

          {givenUp &&
            showRemaining &&
            remaining.map((level, i) => (
              <LevelCard
                key={`${level.id}-rem-${i}`}
                level={level}
                trailing={
                  <p className="mt-1 text-sm font-bold text-destructive">
                    {currentPercentage + 2 + i}%
                  </p>
                }
              />
            ))}
        </section>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 space-y-2">
        {toasts.map((toast, i) => (
          <div
            key={i}
            className="panel px-4 py-2 text-sm"
          >
            {toast}
          </div>
        ))}
      </div>
    </Page>
  );
}
