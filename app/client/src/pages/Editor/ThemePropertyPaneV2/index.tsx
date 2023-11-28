import React from "react";
import * as Sentry from "@sentry/react";

import ThemeEditor from "./ThemeEditor";

export function ThemePropertyPane() {
  return (
    <div className="relative">
      <ThemeEditor />
    </div>
  );
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
