import * as Sentry from "@sentry/react";
import React, { memo, useEffect, useRef, useMemo } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import classNames from "classnames";
import PropertyPane from "pages/Editor/PropertyPane";
import useHorizontalResize from "utils/hooks/useHorizontalResize";

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

export const PropertyPaneSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const {
    onMouseDown,
    onMouseUp,
    onTouchStart,
    resizing,
  } = useHorizontalResize(sidebarRef, props.onWidthChange, true);

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  /**
   * generate the tailwind classnames based on the resizing prop
   */
  const resizerClassnames = useMemo(() => {
    return classNames({
      "w-1 h-full ml-1 bg-transparent group-hover:bg-blue-500 transform transition": true,
      "bg-blue-500": resizing,
    });
  }, [resizing]);

  return (
    <div className="relative">
      <div
        className="w-2 -ml-2 group z-4 cursor-ew-resize absolute left-0 top-0 h-full"
        onMouseDown={onMouseDown}
        onTouchEnd={onMouseUp}
        onTouchStart={onTouchStart}
      >
        <div className={resizerClassnames} />
      </div>
      <div
        className="t--sidebar p-0 z-3 overflow-y-auto bg-warmGray-100 text-white h-full min-w-80 max-w-108"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        <PropertyPane />
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
