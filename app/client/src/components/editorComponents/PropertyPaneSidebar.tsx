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
import { getIsDraggingForSelection } from "selectors/canvasSelectors";

export const PropertyPaneSidebar = memo(() => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isPreviewMode = useSelector(previewModeSelector);
  const isDraggingForSelection = useSelector(getIsDraggingForSelection);
  const isAnyWidgetSelected =
    useSelector(getSelectedWidgets).length > 0 &&
    isDraggingForSelection === false;

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  return (
    <div
      className={classNames({
        "js-property-pane-sidebar bg-white flex h-full t--property-pane-sidebar z-3 transform transition duration-300": true,
        "relative ": !isPreviewMode,
        "fixed translate-x-full right-0": isPreviewMode,
      })}
      ref={sidebarRef}
    >
      <div className="h-full p-0 overflow-y-auto w-72">
        <div className={classNames({ hidden: isAnyWidgetSelected === false })}>
          <WidgetPropertyPane />
        </div>
        <div className={classNames({ hidden: isAnyWidgetSelected === true })}>
          <CanvasPropertyPane />
        </div>
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
