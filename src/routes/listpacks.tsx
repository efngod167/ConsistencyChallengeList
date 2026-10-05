import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { LevelAuthors, Page, Spinner } from "@/components/Shell";
import {
  embed,
  fetchList,
  fetchPacks,
  type ListEntry,
  type Pack,
} from "@/lib/list";

export const Route = createFileRoute("/listpacks")({
  head: () => ({
    meta: [
      { title: "List Packs — CCL" },
      { property: "og:title", content: "List Packs — CCL" },
    ],
  }),
  component: PacksPage,
});

function PacksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: async () => {
      const [list, packs] = await Promise.all([fetchList(), fetchPacks()]);
      return { list, packs } as { list: ListEntry[]; packs: Pack[] };
    },
    staleTime: Infinity,
  });

  const [packIndex, setPackIndex] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);

  const list = data?.list ?? [];
  const packs = data?.packs ?? [];
  const pack = packs[packIndex] ?? null;
  const levelId = pack?.levels[levelIndex] ?? null;
  const level =
    list.find(([lvl]) => String(lvl?.id) === String(levelId))?.[0] ?? null;

  if (isLoading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  return (
    <Page>
      <div className="mb-5 flex flex-wrap gap-2">
        {packs.map((p, i) => (
          <button
            key={p.name}
            onClick={() => {
              setPackIndex(i);
              setLevelIndex(0);
            }}
            style={
              i === packIndex
                ? { backgroundColor: p.color, borderColor: p.color }
                : { borderColor: p.color, color: p.color }
            }
            className={`rounded-full border px-4 py-2 text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-90 ${
              i === packIndex ? "text-background" : "bg-transparent"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="panel max-h-[calc(100vh-11rem)] overflow-y-auto p-2 lg:sticky lg:top-20">
          {pack?.levels.map((id, i) => {
            const name =
              list.find(([lvl]) => String(lvl?.id) === String(id))?.[0]?.name ??
              "Error";
            const active = levelIndex === i;
            return (
              <button
                key={String(id)}
                onClick={() => setLevelIndex(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                }`}
              >
                <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-primary">
                  #{i + 1}
                </span>
                <span className="truncate text-sm font-medium">{name}</span>
              </button>
            );
          })}
        </section>

        <section className="panel overflow-hidden">
          {level ? (
            <div className="p-6">
              <p className="eyebrow">{pack?.name}</p>
              <h1 className="mt-2 text-3xl font-semibold">
                {level.name}
              </h1>
              <LevelAuthors
                author={level.author}
                creators={level.creators ?? []}
                verifier={level.verifier}
              />
              <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-500/15">
                <iframe
                  className="aspect-video w-full"
                  src={embed(level.showcase || level.verification)}
                  title={level.name}
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["ID", String(level.id)],
                  ["FPS", level.fps || "Any"],
                  ["Version", level.version || "Any"],
                  ["Alternating", level.alternating || "No"],
                ].map(([label, value]) => (
                  <li
                    key={label}
                    className="rounded-xl border border-cyan-500/10 bg-surface-2/50 px-3 py-3"
                  >
                    <div className="eyebrow leading-4">{label}</div>
                    <p className="mt-1 truncate text-sm font-semibold">{value}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
              Select a level.
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
