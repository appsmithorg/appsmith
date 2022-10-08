import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import React, { memo, useEffect, useRef, useMemo, useState } from "react";

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
import equal from "fast-deep-equal";
import { selectedWidgetsPresentInCanvas } from "selectors/propertyPaneSelectors";
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import AppSettingsPane from "pages/Editor/AppSettingsPane";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { getExplorerPinned } from "selectors/explorerSelector";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";

type Props = {
  width: number;
  onDragEnd?: () => void;
  onWidthChange: (width: number) => void;
};

export const PropertyPaneSidebar = memo((props: Props) => {
  const dispatch = useDispatch();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevSelectedWidgetId = useRef<string | undefined>();
  const [previousPaneWidth, storePreviousPaneWidth] = useState(props.width);
  const [wasExplorerPinned, storeWasExplorerPinned] = useState<boolean>();

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
  // const themingStack = useSelector(getAppThemingStack);
  const selectedWidgetIds = useSelector(getSelectedWidgets);
  const isDraggingOrResizing = useSelector(getIsDraggingOrResizing);
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);
  const isExplorerPinned = useSelector(getExplorerPinned);

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

  const overridePaneWidth = (width: number) => {
    props.onWidthChange(width);
    props.onDragEnd && props.onDragEnd();
  };

  useEffect(() => {
    if (isAppSettingsPaneOpen) {
      storePreviousPaneWidth(props.width);
      storeWasExplorerPinned(isExplorerPinned);
      if (isExplorerPinned) {
        dispatch(setExplorerActiveAction(false));
        dispatch(setExplorerPinnedAction(false));
      }
      overridePaneWidth(APP_SETTINGS_PANE_WIDTH);
    } else {
      wasExplorerPinned && dispatch(setExplorerPinnedAction(true));
      overridePaneWidth(previousPaneWidth);
    }
  }, [isAppSettingsPaneOpen]);

  /**
   * renders the property pane:
   * 0. if isAppSettingsPaneOpen -> AppSettingsPane
   * 1. if no widget is selected -> CanvasPropertyPane
   * 2. if more than one widget is selected -> MultiWidgetPropertyPane
   * 3. if user is dragging for selection -> CanvasPropertyPane
   * 4. if only one widget is selected -> WidgetPropertyPane
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case isAppSettingsPaneOpen:
        return <AppSettingsPane />;
      case selectedWidgets.length > 1:
        return <MultiSelectPropertyPane />;
      case selectedWidgets.length === 1:
        if (shouldNotRenderPane) return <CanvasPropertyPane />;
        else return <WidgetPropertyPane />;
      case selectedWidgets.length === 0:
        return <CanvasPropertyPane />;
      default:
        return <CanvasPropertyPane />;
    }
  }, [
    isAppSettingsPaneOpen,
    selectedWidgets.length,
    isDraggingForSelection,
    shouldNotRenderPane,
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
        {!isAppSettingsPaneOpen && (
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
        )}
        <div
          className={classNames({
            "h-full p-0 overflow-y-auto min-w-72": true,
            "max-w-104": !isAppSettingsPaneOpen,
          })}
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
