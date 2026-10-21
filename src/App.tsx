import React, { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { UserSessionProvider } from "./context/UserSessionContext";
import { OfflineScreen } from "./components/OfflineScreen";
import { ResumeDocument } from "./components/ResumeDocument";
import { useRenderProfile } from "./hooks/useDeviceTier";
import { RoomExperience } from "./room/RoomExperience";

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const isPrintMode = params.get("print") === "resume";
/** `?offline` previews the offline page without disconnecting. */
const previewOffline = params.has("offline");

/** Standalone print view used by the PDF generator (`?print=resume`). */
function PrintResume() {
  useEffect(() => {
    document.body.classList.add("print-resume");
    document.documentElement.style.background = "#fff";
    document.title = "Abuzar Khan — Resume";
    return () => document.body.classList.remove("print-resume");
  }, []);
  return (
    <div id="resume-print-root" className="bg-white">
      <ResumeDocument siteUrl={(import.meta.env.VITE_SITE_URL as string | undefined) || undefined} />
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** The 3D room, plus the offline screen (with Signal Run) whenever the connection drops. */
function Portfolio() {
  const render = useRenderProfile();
  const online = useOnline();
  const [visible, setVisible] = useState(true);
  const [offlineOpen, setOfflineOpen] = useState(previewOffline || !online);

  useEffect(() => {
    if (!online) setOfflineOpen(true);
  }, [online]);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <>
      <RoomExperience render={render} active={visible && !offlineOpen} />
      <AnimatePresence>
        {offlineOpen && (
          <OfflineScreen key="offline" mode="offline" online={online && !previewOffline} onClose={() => setOfflineOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  if (isPrintMode) return <PrintResume />;
  return (
    <UserSessionProvider>
      <Portfolio />
    </UserSessionProvider>
  );
}
