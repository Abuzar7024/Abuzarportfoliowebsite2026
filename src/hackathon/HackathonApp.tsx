import React, { Suspense, lazy, useEffect } from "react";
import { POLICY_SLUGS } from "../shared/hackathon-content";
import { HomePage } from "./HomePage";
import { usePath, useContent } from "./lib";
import { PolicyPage, POLICY_ROUTES } from "./PolicyPage";
import { SiteFooter, SiteHeader } from "./ui";

const RegisterFlow = lazy(() => import("./RegisterFlow").then((m) => ({ default: m.RegisterFlow })));
const PaymentPage = lazy(() => import("./PaymentPage").then((m) => ({ default: m.PaymentPage })));
const StatusPage = lazy(() => import("./StatusPage").then((m) => ({ default: m.StatusPage })));
const AdminPage = lazy(() => import("./AdminPage").then((m) => ({ default: m.AdminPage })));

/** AVATAR Hackathon site, rendered under /competition/*. */
export function HackathonApp({ onBackToRoom }: { onBackToRoom: () => void }) {
  const path = usePath();
  const data = useContent();
  const sub = path.replace(/^\/competition/, "") || "/";

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "AVATAR — DESIGN. BUILD. SELL. IN ONE DAY. | Pre-Registrations Open";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  let page: React.ReactNode;
  if (sub === "/") page = <HomePage data={data} />;
  else if (sub === "/register") page = <RegisterFlow data={data} onReload={data.reload} />;
  else if (sub === "/payment") page = <PaymentPage data={data} />;
  else if (sub === "/status" || sub === "/dashboard") page = <StatusPage data={data} />;
  else if (sub === "/admin") page = <AdminPage />;
  else {
    const m = sub.match(/^\/(?:policy\/)?([a-z]+)$/);
    const slug = m ? POLICY_ROUTES[m[1]] : undefined;
    page = slug && POLICY_SLUGS.includes(slug) ? <PolicyPage slug={slug} data={data} /> : <HomePage data={data} />;
  }

  return (
    <div id="hk-scroll" data-testid="hackathon-site" className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f6f4ef] font-jakarta text-[#15181d] selection:bg-[#d6281f] selection:text-white">
      <SiteHeader settings={data.content.settings} onHome={sub === "/"} onBackToRoom={onBackToRoom} />
      <main>
        <Suspense fallback={<p className="px-6 py-20 text-[16px]" role="status">Loading…</p>}>{page}</Suspense>
      </main>
      <SiteFooter content={data.content} onBackToRoom={onBackToRoom} />
    </div>
  );
}
