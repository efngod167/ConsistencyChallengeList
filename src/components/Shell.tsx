import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "List" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/listpacks", label: "Packs" },
  { to: "/requirements", label: "Requirements" },
] as const;

export function Spinner() {
  return (
    <div className="flex w-full items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/10 bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-[1600px] flex-wrap items-center gap-4 px-5 py-3 lg:gap-7">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/newicon.png"
            alt="CCL"
            className="h-11 w-11 rounded-xl border border-cyan-500/20"
          />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-black uppercase tracking-tight">
              CCL
            </span>
            <span className="mt-1 text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
              v3
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border border-cyan-500/10 bg-surface/60 p-1 backdrop-blur-md">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === "/" }}
              className="rounded-full px-4 py-2 text-xs font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground data-[status=active]:bg-surface-2 data-[status=active]:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://www.youtube.com/@ConsistencyChallengeList-y9c"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/10 text-muted-foreground transition-colors hover:border-cyan-500/40 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
            </svg>
          </a>
          <a
            href="https://github.com/efngod167/ConsistencyChallengeList"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/10 text-muted-foreground transition-colors hover:border-cyan-500/40 hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/zNtDVvpHTN"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold tracking-widest text-primary-foreground uppercase transition-colors hover:bg-primary/85"
          >
            Join Server
          </a>
        </div>
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[1600px] px-5 py-6">{children}</main>
    </>
  );
}

export function LevelAuthors({
  author,
  creators,
  verifier,
}: {
  author: string;
  creators: string[];
  verifier: string;
}) {
  const selfVerified = author === verifier && creators.length === 0;
  const rows: Array<[string, string]> = selfVerified
    ? [["Creator & Verifier", author]]
    : creators.length === 0
      ? [
          ["Creator", author],
          ["Verifier", verifier],
        ]
      : [
          ["Creators", creators.join(", ")],
          ["Verifier", verifier],
        ];
  rows.push(["Publisher", author]);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <span className="eyebrow">{label}</span>
          <span className="text-sm text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}
