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
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
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

// Applies saved theme and locale before paint to avoid flashes.
const initScript = `(function(){try{
  var t=localStorage.getItem('theme');
  if(t==='dark')document.documentElement.classList.add('dark');
  var l=localStorage.getItem('locale');
  if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}
}catch(e){}})();`;

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
