import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Github, ListOrdered, MessageCircle, Trophy } from "lucide-react";

import { Page } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Consistency Challenge List — CCL" },
      {
        property: "og:title",
        content: "Consistency Challenge List — CCL",
      },
    ],
  }),
  component: HomePage,
});

const destinations = [
  { label: "List", to: "/list", icon: ListOrdered },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
  { label: "Packs", to: "/listpacks", icon: Boxes },
  { label: "Server", href: "https://discord.gg/zNtDVvpHTN", icon: MessageCircle },
] as const;

const repositoryUrl = "https://github.com/efngod167/ConsistencyChallengeList";

function HomePage() {
  return (
    <Page>
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden xl:block"
        >
          <span className="absolute left-0 top-[18%] h-10 w-3 bg-accent/70" />
          <span className="absolute left-0 top-[38%] h-16 w-8 bg-primary/25" />
          <span className="absolute left-0 top-[73%] h-12 w-5 bg-accent/50" />
          <span className="absolute right-0 top-[27%] h-14 w-7 bg-primary/25" />
          <span className="absolute right-0 top-[53%] h-10 w-3 bg-accent/70" />
          <span className="absolute right-0 top-[79%] h-16 w-8 bg-primary/25" />
        </div>

        <div className="relative z-10 mx-auto max-w-[66rem]">
          <section className="grid gap-7 pb-7 pt-8 sm:pb-9 sm:pt-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Consistency Challenge List
              </h1>
              <h2 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
                Welcome to the Consistency Challenge List!
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                The Consistency Challenge List is a collection and ranking of the hardest verified consistency challenges in Geometry Dash.
              </p>
            </div>
            <Link
              to="/list"
              className="inline-flex min-h-12 items-center justify-center gap-3 justify-self-start bg-accent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:justify-self-end"
            >
              The List
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <nav aria-label="Explore the site" className="pb-8 sm:pb-10">
            <ul className="grid max-w-2xl grid-cols-2 gap-y-3 sm:grid-cols-4 sm:gap-y-0">
              {destinations.map((destination) => {
                const Icon = destination.icon;
                const content = (
                  <>
                    <span className="text-sm">{destination.label}</span>
                    <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                  </>
                );
                const className =
                  "inline-flex min-h-20 min-w-28 flex-col items-center justify-center gap-1 px-4 py-2 font-bold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

                return (
                  <li key={destination.label} className="text-center">
                    {"to" in destination ? (
                      <Link to={destination.to} className={className}>
                        {content}
                      </Link>
                    ) : (
                      <a
                        href={destination.href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center">
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-3 justify-self-start bg-accent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              To the repository
            </a>
            <div className="max-w-2xl lg:justify-self-end lg:text-right">
              <h2 className="text-2xl font-bold tracking-tight">Check out our GitHub!</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Report any issues, or provide suggestions through our GitHub or Discord server.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}
