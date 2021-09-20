import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import React, { memo, useEffect, useRef } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import { previewModeSelector } from "selectors/editorSelectors";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";

export const PropertyPaneSidebar = memo(() => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAnyWidgetSelected = useSelector(getSelectedWidgets).length > 0;

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  return (
    <div
      className={classNames({
        "bg-white flex h-full t--property-pane-sidebar z-3 transform transition duration-300": true,
        "relative ": !isPreviewMode,
        "fixed translate-x-full right-0": isPreviewMode,
      })}
      ref={sidebarRef}
    >
      <div className="h-full p-0 overflow-y-auto w-72">
        {isAnyWidgetSelected ? <WidgetPropertyPane /> : <CanvasPropertyPane />}
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
