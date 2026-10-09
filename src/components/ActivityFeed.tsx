import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CircleDot,
  History,
  Trophy,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import {
  fetchActivity,
  type ActivityEvent,
} from "@/lib/list";

type FeedTab = "changelog" | "achievements";

type EventGroup = {
  key: string;
  label: string;
  events: ActivityEvent[];
};

function groupEvents(events: ActivityEvent[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();

  for (const event of events) {
    const date = new Date(event.timestamp);
    const validDate = !Number.isNaN(date.getTime());
    const key = validDate ? format(date, "yyyy-MM-dd") : "unknown";
    let label = "DATE UNKNOWN";

    if (validDate) {
      label = isToday(date)
        ? "TODAY"
        : isYesterday(date)
          ? "YESTERDAY"
          : format(date, "MMMM d, yyyy").toUpperCase();
    }

    const group = groups.get(key);
    if (group) {
      group.events.push(event);
    } else {
      groups.set(key, { key, label, events: [event] });
    }
  }

  return Array.from(groups.values());
}

function LinkedText({
  href,
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className: string;
}) {
  if (!href) return <span className={className}>{children}</span>;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function LevelName({
  name,
  href,
  emphasis = false,
}: {
  name: string;
  href?: string;
  emphasis?: boolean;
}) {
  return (
    <LinkedText
      href={href}
      className={
        emphasis
          ? "font-bold text-foreground transition-colors hover:text-primary"
          : "font-medium text-[#7895c6] transition-colors hover:text-primary"
      }
    >
      {name}
    </LinkedText>
  );
}

function EventText({ event }: { event: ActivityEvent }) {
  if (event.type === "completion") {
    return (
      <>
        <LinkedText
          href={event.recordHref}
          className="font-semibold text-foreground transition-colors hover:text-primary"
        >
          {event.user}
        </LinkedText>{" "}
        completed{" "}
        <LevelName name={event.levelName} href={event.levelHref} /> at{" "}
        <strong className="font-semibold text-foreground">#{event.rank}</strong>
        {event.percent === undefined ? "" : " (" + event.percent + "%)"}
      </>
    );
  }

  if (event.type === "verification") {
    return (
      <>
        <LevelName name={event.levelName} href={event.levelHref} emphasis /> was
        placed at{" "}
        <strong className="font-semibold text-foreground">#{event.rank}</strong>{" "}
        and verified
      </>
    );
  }

  if (event.type === "placement") {
    return (
      <>
        <LevelName name={event.levelName} href={event.levelHref} emphasis />{" "}
        placed at{" "}
        <strong className="font-semibold text-foreground">#{event.rank}</strong>
        {event.above && (
          <>
            , above{" "}
            <LevelName name={event.above.name} href={event.above.href} />
          </>
        )}
        {event.below && (
          <>
            , below{" "}
            <LevelName name={event.below.name} href={event.below.href} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <LevelName name={event.levelName} href={event.levelHref} emphasis />{" "}
      <span className="tabular-nums text-muted-foreground">
        #{event.previousRank} → #{event.rank}
      </span>
      {event.above && (
        <>
          , above{" "}
          <LevelName name={event.above.name} href={event.above.href} />
        </>
      )}
      {event.below && (
        <>
          , below{" "}
          <LevelName name={event.below.name} href={event.below.href} />
        </>
      )}
    </>
  );
}

function ActivityMarker({ event }: { event: ActivityEvent }) {
  if (event.type === "placement") {
    return (
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
        <CircleDot className="h-3 w-3" aria-hidden="true" />
      </span>
    );
  }

  if (event.type === "rank-change") {
    const movedUp = event.rank < event.previousRank;
    const Icon = movedUp ? ArrowUp : ArrowDown;
    return (
      <span
        className={
          movedUp
            ? "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
            : "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400"
        }
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
      </span>
    );
  }

  if (event.type === "verification") {
    return (
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
      <Trophy className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

function EventList({
  events,
  loading,
  error,
  emptyMessage,
}: {
  events: ActivityEvent[];
  loading: boolean;
  error: boolean;
  emptyMessage: string;
}) {
  const groups = useMemo(() => groupEvents(events), [events]);

  if (loading) {
    return (
      <p className="py-14 text-center text-sm text-muted-foreground" role="status">
        Loading activity…
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-14 text-center text-sm text-muted-foreground" role="status">
        Activity is unavailable right now.
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="flex items-center gap-3 py-2">
            <span className="h-px min-w-4 flex-1 bg-border/70" />
            <h2 className="shrink-0 text-[0.65rem] font-bold tracking-[0.12em] text-[#58739f]">
              {group.label}
            </h2>
            <span className="h-px min-w-4 flex-1 bg-border/70" />
          </div>

          <ul>
            {group.events.map((event, index) => (
              <li
                key={
                  event.type +
                  ":" +
                  event.levelId +
                  ":" +
                  event.timestamp +
                  ":" +
                  index
                }
                className="flex min-w-0 items-start gap-3 border-b border-border/50 py-4 last:border-b-0"
              >
                <ActivityMarker event={event} />
                <p className="min-w-0 break-words text-[0.8rem] leading-6 text-muted-foreground">
                  <EventText event={event} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ActivityFeed() {
  const [tab, setTab] = useState<FeedTab>("changelog");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    staleTime: Infinity,
  });

  const source =
    tab === "changelog"
      ? (data?.changelog ?? [])
      : (data?.achievements ?? []);
  const events = useMemo(
    () =>
      [...source]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime(),
        )
        .slice(0, 30),
    [source],
  );

  const activeTabId =
    tab === "changelog" ? "activity-changelog-tab" : "activity-achievements-tab";

  return (
    <section className="panel mx-0 flex h-[68dvh] min-h-[24rem] max-h-[36rem] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#070b12]/90">
      <div className="border-b border-border/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-lg font-black tracking-tight">
            <History className="h-4 w-4 text-primary" aria-hidden="true" />
            {tab === "changelog" ? "Recent Changes" : "Recent Achievements"}
          </h1>

          <div
            role="tablist"
            aria-label="Activity feed"
            className="grid w-full grid-cols-2 items-center gap-1 rounded-lg border border-cyan-500/15 bg-background/60 p-1 sm:flex sm:w-auto"
          >
            <button
              type="button"
              id="activity-changelog-tab"
              role="tab"
              aria-selected={tab === "changelog"}
              aria-controls="activity-feed-panel"
              onClick={() => setTab("changelog")}
              className={
                tab === "changelog"
                  ? "min-w-0 rounded-md bg-transparent px-1.5 py-2 text-center text-[0.68rem] font-bold leading-4 text-foreground shadow-none sm:px-3 sm:text-xs"
                  : "min-w-0 rounded-md bg-transparent px-1.5 py-2 text-center text-[0.68rem] font-semibold leading-4 text-muted-foreground shadow-none transition-colors hover:text-foreground sm:px-3 sm:text-xs"
              }
            >
              Changelog
            </button>
            <button
              type="button"
              id="activity-achievements-tab"
              role="tab"
              aria-selected={tab === "achievements"}
              aria-controls="activity-feed-panel"
              onClick={() => setTab("achievements")}
              className={
                tab === "achievements"
                  ? "min-w-0 rounded-md bg-transparent px-1.5 py-2 text-center text-[0.68rem] font-bold leading-4 text-foreground shadow-none sm:px-3 sm:text-xs"
                  : "min-w-0 rounded-md bg-transparent px-1.5 py-2 text-center text-[0.68rem] font-semibold leading-4 text-muted-foreground shadow-none transition-colors hover:text-foreground sm:px-3 sm:text-xs"
              }
            >
              Recent Achievements
            </button>
          </div>
        </div>
      </div>

      <div
        id="activity-feed-panel"
        role="tabpanel"
        aria-labelledby={activeTabId}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6"
      >
        <EventList
          events={events}
          loading={isLoading}
          error={isError}
          emptyMessage="No activity has been recorded yet."
        />
      </div>
    </section>
  );
}
