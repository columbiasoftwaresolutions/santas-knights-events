"use client";

import { Button } from "@/components/ui/button";

// Shown when the directory cannot be read. It never falls back to invented data.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
      <h1 className="display text-4xl sm:text-5xl">The directory could not load.</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        The listings could not be read just now. Nothing is wrong with your connection. Try again in
        a minute.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
