import * as Sentry from "@sentry/react";
import React from "react";
import { ThemeCard } from "./ThemeCard";

export function ThemePropertyPane() {
  return (
    <div className="relative space-y-2">
      <div className="px-3 py-3">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard
          backgroundColor="#e1e1e1"
          borderRadius="xl"
          className="mt-2"
          primaryColor="rgba(192,132,252)"
        />
      </div>
      <div className="border-t" />
    </div>
  );
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
