import React from "react";
import * as Sentry from "@sentry/react";

import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import ThemeEditor from "../ThemePropertyPane/ThemeEditor";

type Props = {
  skipThemeEditor?: boolean;
};

export function CanvasPropertyPane(props: Props) {
  return (
    <div className="relative ">
      <h3 className="px-3 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-3 space-y-2">
          <p className="text-sm text-gray-700">Canvas Size</p>
          <MainContainerLayoutControl />
        </div>

        {!props.skipThemeEditor && <ThemeEditor />}
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
