import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import React, { memo, useEffect, useRef, useMemo } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import { tailwindLayers } from "constants/Layers";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import { previewModeSelector } from "selectors/editorSelectors";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { getIsDraggingForSelection } from "selectors/canvasSelectors";
import MultiSelectPropertyPane from "pages/Editor/MultiSelectPropertyPane";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";
import { ThemePropertyPane } from "pages/Editor/ThemePropertyPane";
import { getAppThemingStack } from "selectors/appThemingSelectors";
import equal from "fast-deep-equal";
import { selectedWidgetsPresentInCanvas } from "selectors/propertyPaneSelectors";

type Props = {
  width: number;
  onDragEnd?: () => void;
  onWidthChange: (width: number) => void;
};

export const PropertyPaneSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevSelectedWidgetId = useRef<string | undefined>();

  const {
    onMouseDown,
    onMouseUp,
    onTouchStart,
    resizing,
  } = useHorizontalResize(
    sidebarRef,
    props.onWidthChange,
    props.onDragEnd,
    true,
  );

  const isPreviewMode = useSelector(previewModeSelector);
  const themingStack = useSelector(getAppThemingStack);
  const selectedWidgetIds = useSelector(getSelectedWidgets);
  const isDraggingOrResizing = useSelector(getIsDraggingOrResizing);

  //while dragging or resizing and
  //the current selected WidgetId is not equal to previous widget Id,
  //then don't render PropertyPane
  const shouldNotRenderPane =
    isDraggingOrResizing &&
    selectedWidgetIds[0] !== prevSelectedWidgetId.current;

  // This is to keep the theming properties from changing,
  // while dragging a widget when no other widgets were selected
  const keepThemeWhileDragging =
    prevSelectedWidgetId.current === undefined && shouldNotRenderPane;

  const selectedWidgets = useSelector(selectedWidgetsPresentInCanvas, equal);

  const isDraggingForSelection = useSelector(getIsDraggingForSelection);

  prevSelectedWidgetId.current =
    selectedWidgetIds.length === 1 ? selectedWidgetIds[0] : undefined;

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  /**
   * renders the property pane:
   * 1. if no widget is selected -> CanvasPropertyPane
   * 2. if more than one widget is selected -> MultiWidgetPropertyPane
   * 3. if user is dragging for selection -> CanvasPropertyPane
   * 4. if only one widget is selected -> WidgetPropertyPane
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case selectedWidgets.length > 1:
        return <MultiSelectPropertyPane />;
      case selectedWidgets.length === 1:
        if (shouldNotRenderPane)
          return (
            <CanvasPropertyPane skipThemeEditor={!keepThemeWhileDragging} />
          );
        else return <WidgetPropertyPane />;
      case themingStack.length > 0:
        return <ThemePropertyPane />;
      case selectedWidgets.length === 0:
        return <CanvasPropertyPane />;
      default:
        return <CanvasPropertyPane />;
    }
  }, [
    selectedWidgets.length,
    isDraggingForSelection,
    shouldNotRenderPane,
    themingStack.join(","),
    keepThemeWhileDragging,
  ]);

  return (
    <div className="relative">
      {/* PROPERTY PANE */}
      <div
        className={classNames({
          [`js-property-pane-sidebar t--property-pane-sidebar bg-white flex h-full  border-l border-gray-200 transform transition duration-300 ${tailwindLayers.propertyPane}`]: true,
          "relative ": !isPreviewMode,
          "fixed translate-x-full right-0": isPreviewMode,
        })}
        ref={sidebarRef}
      >
        {/* RESIZOR */}
        <div
          className={`absolute top-0 left-0 w-2 h-full -ml-1 group  cursor-ew-resize ${tailwindLayers.resizer}`}
          onMouseDown={onMouseDown}
          onTouchEnd={onMouseUp}
          onTouchStart={onTouchStart}
        >
          <div
            className={classNames({
              "w-1 h-full ml-1 bg-transparent group-hover:bg-gray-300 transform transition": true,
              "bg-gray-300": resizing,
            })}
          />
        </div>
        <div
          className="h-full p-0 overflow-y-auto min-w-72 max-w-104"
          style={{ width: props.width }}
        >
          {propertyPane}
        </div>
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
