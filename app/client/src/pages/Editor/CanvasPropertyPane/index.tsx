import * as Sentry from "@sentry/react";
import React from "react";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import { ThemeCard } from "../ThemePropertyPane/ThemeCard";

export function CanvasPropertyPane() {
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <div className="relative ">
      <h3 className="px-3 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="space-y-4">
        <div className="px-3 space-y-2">
          <p className="text-sm text-gray-700">Canvas Size</p>
          <MainContainerLayoutControl />
        </div>

        <div className="px-3 space-y-2">
          <p className="text-sm text-gray-700">Theme</p>
          <ThemeCard changeable editable theme={selectedTheme} />
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
