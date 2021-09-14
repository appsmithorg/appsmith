import * as Sentry from "@sentry/react";
import React, { memo } from "react";

import { MainContainerLayoutControl } from "../MainContainerLayoutControl";

export const CanvasPropertyPane = memo(() => {
  return (
    <div className="relative py-3 space-y-3">
      <div className="px-3">
        <h3 className="text-lg font-semibold">Properties</h3>
      </div>

      <MainContainerLayoutControl />
    </div>
  );
});

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
