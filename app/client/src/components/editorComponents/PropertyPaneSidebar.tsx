import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import React, { memo, useEffect, useRef } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";
import { previewModeSelector } from "selectors/editorSelectors";

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
        "h-full p-0 overflow-y-auto bg-white t--property-pane-sidebar z-3 w-96 transform transition": true,
        "relative ": !isPreviewMode,
        "fixed translate-x-full right-0": isPreviewMode,
      })}
      ref={sidebarRef}
    >
      {isAnyWidgetSelected ? <WidgetPropertyPane /> : <CanvasPropertyPane />}
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
