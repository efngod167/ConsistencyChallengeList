import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { LevelAuthors, Page, Spinner } from "@/components/Shell";
import {
  embed,
  fetchList,
  getThumbnailFromId,
  getYoutubeIdFromUrl,
  score,
  type ListEntry,
} from "@/lib/list";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CCL — Official Rankings" },
      { property: "og:title", content: "CCL — Official Rankings" },
    ],
  }),
  component: ListPage,
});

function thumbnailFor(video?: string): string | null {
  if (!video) return null;
  const id = getYoutubeIdFromUrl(video);
  return id ? getThumbnailFromId(id) : null;
}

function ListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["list"],
    queryFn: async () => (await fetchList()) as ListEntry[],
    staleTime: Infinity,
  });

  const [selected, setSelected] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const list = useMemo(() => data ?? [], [data]);

  const errors = useMemo(
    () =>
      list
        .filter(([, err]) => err)
        .map(([, err]) => `Failed to load level. (${err}.json)`),
    [list],
  );

  const filtered = useMemo(() => {
    if (!query) return list;
    return list.filter(
      ([level]) =>
        level?.name && level.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [list, query]);

  const selectedLevel = filtered[selected]?.[0] ?? null;
  const rankOf = (id?: string) =>
    id ? list.findIndex(([lvl]) => lvl?.id === id) + 1 : selected + 1;
  const selectedRank = rankOf(selectedLevel?.id);

  if (isLoading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  return (
    <Page>
      {errors.length > 0 && (
        <div className="mb-5 space-y-1 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          {errors.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <section className="panel flex max-h-[calc(100vh-11rem)] flex-col overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-cyan-500/10 p-5">
            <p className="eyebrow">Placements</p>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
              placeholder="Search levels..."
              className="mt-4 w-full rounded-xl border border-cyan-500/15 bg-[#06090F]/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                No levels match your search.
              </p>
            )}
            {filtered.map(([level, err], i) => {
              const rank = level ? rankOf(level.id) : i + 1;
              const active = selected === i;
              const thumb = thumbnailFor(
                level?.showcase || level?.verification,
              );
              return (
                <button
                  key={level?.id ?? err ?? i}
                  onClick={() => {
                    setSelected(i);
                    setDetailsOpen(true);
                  }}
                  className={`site-level-card flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? "border-primary/40 bg-surface-2 text-foreground"
                      : "border-cyan-500/10 text-muted-foreground hover:border-cyan-500/25 hover:bg-surface-2/60 hover:text-foreground"
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={level?.name ?? "Level thumbnail"}
                      loading="lazy"
                      className="h-16 w-28 shrink-0 rounded-xl border border-cyan-500/15 object-cover"
                    />
                  ) : (
                    <div className="h-16 w-28 shrink-0 rounded-xl border border-cyan-500/15 bg-surface-2" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-bold tracking-widest tabular-nums ${
                        rank <= 200 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {rank <= 200 ? `#${rank}` : "Legacy"}
                    </span>
                    <span
                      className={`mt-1 block truncate text-sm font-bold ${
                        err ? "text-destructive" : ""
                      }`}
                    >
                      {level?.name ?? `Error (${err}.json)`}
                    </span>
                    {level && (
                        <span className="mt-1 block truncate text-[0.68rem] text-muted-foreground">
                        {level.author} · verified by {level.verifier}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
          }}
          className={`fixed inset-0 z-50 items-center justify-center bg-black/75 p-4 ${
            detailsOpen ? "flex" : "hidden"
          } lg:static lg:inset-auto lg:z-auto lg:flex lg:items-start lg:justify-start lg:bg-transparent lg:p-0`}
        >
          <section
            className={`panel relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto shadow-lg shadow-black/30 lg:sticky lg:top-24 lg:max-h-[calc(100vh-11rem)] lg:max-w-none lg:shadow-none ${
              detailsOpen
                ? "animate-in fade-in-0 zoom-in-95 duration-250 ease-out"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              aria-label="Close level details"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-foreground transition-colors hover:bg-accent lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          {selectedLevel ? (
            <div className="p-5 sm:p-8">
              <p className="eyebrow text-primary">
                {selectedRank <= 200 ? `Rank #${selectedRank}` : "Legacy list"}
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                {selectedLevel.name}
              </h2>
              <LevelAuthors
                author={selectedLevel.author}
                creators={selectedLevel.creators ?? []}
                verifier={selectedLevel.verifier}
              />

              <div className="mt-7 overflow-hidden rounded-2xl border border-cyan-500/15">
                <iframe
                  className="aspect-video w-full"
                  src={embed(selectedLevel.showcase || selectedLevel.verification)}
                  title={selectedLevel.name}
                  frameBorder="0"
                  allowFullScreen
                />
              </div>

              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  [
                    "Points when completed",
                    String(
                      score(selectedRank, 100, selectedLevel.percentToQualify),
                    ),
                  ],
                  ["ID", String(selectedLevel.id)],
                  ["FPS", selectedLevel.fps || "Any"],
                  ["Version", selectedLevel.version || "Any"],
                  ["CBF", selectedLevel.CBF || "Yes"],
                ].map(([label, value]) => (
                  <li
                    key={label}
                    className="rounded-xl border border-cyan-500/10 bg-surface-2/40 px-3 py-3"
                  >
                    <div className="eyebrow leading-4">{label}</div>
                    <p className="mt-1 truncate text-sm font-semibold">{value}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-baseline justify-between gap-4">
                <h3 className="text-2xl font-black tracking-tight">Records</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRank <= 100 ? (
                    <>
                      <strong className="text-foreground">
                        {selectedLevel.percentToQualify}%
                      </strong>{" "}
                      to qualify
                    </>
                  ) : selectedRank <= 200 ? (
                    <>
                      <strong className="text-foreground">100%</strong> to qualify
                    </>
                  ) : (
                    "This level does not accept new records."
                  )}
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/10">
                {selectedLevel.records.map((record, i) => (
                  <div
                    key={`${record.user}-${i}`}
                    className="flex items-center gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 odd:bg-surface-2/30"
                  >
                    <p className="w-14 shrink-0 text-sm font-semibold tabular-nums text-primary">
                      {record.percent}%
                    </p>
                    <a
                      href={record.link}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {record.user}
                    </a>
                    {record.mobile && (
                      <img
                        src="/assets/phone-landscape-dark.svg"
                        alt="Mobile"
                        className="h-4 w-4 opacity-70"
                      />
                    )}
                    <p className="ml-auto text-sm text-muted-foreground">
                      {record.hz}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
              Select a level.
            </div>
          )}
          </section>
        </div>
      </div>
    </Page>
  );
}
