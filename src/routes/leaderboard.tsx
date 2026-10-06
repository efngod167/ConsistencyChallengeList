import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Page, Spinner } from "@/components/Shell";
import { fetchLeaderboard, localize, type Score } from "@/lib/list";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Player Leaderboard — CCL" },
      { property: "og:title", content: "Player Leaderboard — CCL" },
    ],
  }),
  component: LeaderboardPage,
});

function ScoreTable({ title, scores }: { title: string; scores: Score[] }) {
  if (!scores.length) return null;
  return (
    <>
      <h2 className="mt-7 text-sm font-semibold uppercase text-muted-foreground">
        {title} ({scores.length})
      </h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-cyan-500/10">
        {scores.map((s, i) => (
          <div
            key={`${s.level}-${i}`}
            className="flex items-center gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 odd:bg-surface-2/30"
          >
            <p className="w-14 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
              #{s.rank}
            </p>
            <a
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium hover:text-primary"
            >
              {s.percent !== undefined ? `${s.percent}% ` : ""}
              {s.level}
            </a>
            <p className="ml-auto text-sm font-semibold tabular-nums text-primary">
              +{localize(s.score)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: Infinity,
  });

  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");

  const leaderboard = data?.[0] ?? [];
  const err = data?.[1] ?? [];

  const filtered = useMemo(() => {
    if (!query) return leaderboard;
    return leaderboard.filter((e) =>
      e.user?.toLowerCase().includes(query.toLowerCase()),
    );
  }, [leaderboard, query]);

  const entry = filtered[selected] ?? null;
  const rank = entry
    ? leaderboard.findIndex((e) => e.user === entry.user) + 1
    : "-";

  if (isLoading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  return (
    <Page>
      {err.length > 0 && (
        <p className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          Leaderboard may be incorrect, as the following levels could not be
          loaded: {err.join(", ")}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section className="panel flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden lg:sticky lg:top-20">
          <div className="border-b border-border p-4">
            <p className="eyebrow">Players</p>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
              placeholder="Search users..."
              className="mt-3 w-full rounded-xl border border-cyan-500/15 bg-background/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            )}
            {filtered.map((e, i) => {
              const active = selected === i;
              const position =
                leaderboard.findIndex((x) => x.user === e.user) + 1;
              return (
                <button
                  key={e.user}
                  onClick={() => setSelected(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                  }`}
                >
                  <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-primary">
                    #{position}
                  </span>
                  <span className="truncate text-sm font-medium">{e.user}</span>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {localize(e.total)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel overflow-hidden">
          {entry ? (
            <div className="p-6">
              <p className="eyebrow">Rank #{rank}</p>
              <h1 className="mt-2 text-3xl font-semibold">
                {entry.user}
              </h1>
              <p className="mt-1 text-primary text-2xl font-semibold tabular-nums">
                {localize(entry.total)}
              </p>
              <ScoreTable title="Verified" scores={entry.verified} />
              <ScoreTable title="Completed" scores={entry.completed} />
              <ScoreTable title="Progressed" scores={entry.progressed} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
              Select a player.
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
