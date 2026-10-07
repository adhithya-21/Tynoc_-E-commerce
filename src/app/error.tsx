"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application error:", error); }, [error]);
  return <main className="not-found"><span className="eyebrow">A SMALL PAUSE</span><h1>Something got<br /><em>a little tangled.</em></h1><p>We couldn&apos;t gather things just now. Please give it another try.</p><button className="button-dark" onClick={reset}>Try again <span>↗</span></button></main>;
}
