import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Page, Spinner } from "@/components/Shell";
import { RULES } from "@/components/rules";
import { fetchEditors } from "@/lib/list";

export const Route = createFileRoute("/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements & Credits — CCL" },
      {
        property: "og:title",
        content: "Requirements & Credits — CCL",
      },
    ],
  }),
  component: RequirementsPage,
});

const roleIconMap: Record<string, string> = {
  owner: "crown",
  admin: "user-gear",
  helper: "user-shield",
  dev: "code",
  trial: "user-lock",
};

function RequirementsPage() {
  const { data: editors, isLoading } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
    staleTime: Infinity,
  });

  return (
    <Page>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold">Requirements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Level and record submissions are submitted via our discord.
        </p>

        {RULES.map((section) => (
          <section key={section.title} className="panel mt-6 p-6">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.paragraphs.map((html, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:hover:underline [&_b]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
            </div>
          </section>
        ))}

        <h2 className="mt-12 text-3xl font-semibold">Credits</h2>

        <section className="panel mt-6 p-6">
          <h3 className="text-lg font-semibold">List Editors</h3>
          {isLoading ? (
            <Spinner />
          ) : (
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {(editors ?? []).map((editor, i) => (
                <li
                  key={`${editor.name}-${i}`}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src={`/assets/${roleIconMap[editor.role]}-dark.svg`}
                    alt={editor.role}
                    className="h-4 w-4 opacity-80"
                  />
                  {editor.link ? (
                    <a
                      href={editor.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm hover:text-primary"
                    >
                      {editor.name}
                    </a>
                  ) : (
                    <p className="text-sm">{editor.name}</p>
                  )}
                  <span className="eyebrow ml-auto">{editor.role}</span>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Website made by{" "}
            <a
              className="text-primary hover:underline"
            >
              Aqua
            </a>
          </p>
        </section>
      </div>
    </Page>
  );
}
