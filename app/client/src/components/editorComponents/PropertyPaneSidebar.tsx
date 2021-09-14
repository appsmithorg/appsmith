import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import React, { memo, useEffect, useRef } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

export const PropertyPaneSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAnyWidgetSelected = useSelector(getSelectedWidgets).length > 0;

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  return (
    <div className="relative">
      <div
        className="t--property-pane-sidebar p-0 z-3 overflow-y-auto bg-white h-full min-w-72"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {isAnyWidgetSelected ? <WidgetPropertyPane /> : <CanvasPropertyPane />}
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
