import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "BacAllemand — Apprends l'allemand pour le bac" },
      {
        name: "description",
        content:
          "Plateforme d'apprentissage de l'allemand pour le baccalauréat algérien.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

/**
 * In SPA mode (entry-client.tsx), the HTML shell comes from index.html,
 * so we must NOT render <html>/<head>/<body> again — just the content.
 * In SSR mode (TanStack Start), we render the full document.
 */
function RootDocument({ children }: { children: ReactNode }) {
  const isSPA =
    typeof document !== "undefined" &&
    document.getElementById("root") !== null;

  if (isSPA) {
    // SPA mode — index.html provides the HTML shell
    return <>{children}</>;
  }

  // SSR mode — render full HTML document
  return (
    <html lang="fr" dir="ltr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('theme');
              if(t==='dark')document.documentElement.classList.add('dark');
              var l=localStorage.getItem('locale');
              if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}
            }catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
