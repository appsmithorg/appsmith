import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import React, { memo, useEffect, useRef } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";

export const PropertyPaneSidebar = memo(() => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAnyWidgetSelected = useSelector(getSelectedWidgets).length > 0;

  // eslint-disable-next-line
  console.log({ location });
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  return (
    <div
      className="h-full p-0 overflow-y-auto bg-white t--property-pane-sidebar z-3 w-80"
      ref={sidebarRef}
    >
      {isAnyWidgetSelected ? <WidgetPropertyPane /> : <CanvasPropertyPane />}
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
