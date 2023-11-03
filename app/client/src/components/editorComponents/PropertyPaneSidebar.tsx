import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import React, { memo, useContext, useEffect, useMemo, useRef } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getSelectedWidgets } from "selectors/ui";
import { tailwindLayers } from "constants/Layers";
import WidgetPropertyPane from "pages/Editor/PropertyPane";
import CanvasPropertyPane from "pages/Editor/CanvasPropertyPane";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { getIsDraggingForSelection } from "selectors/canvasSelectors";
import MultiSelectPropertyPane from "pages/Editor/MultiSelectPropertyPane";
import { getIsDraggingOrResizing } from "selectors/widgetSelectors";
import { selectedWidgetsPresentInCanvas } from "selectors/propertyPaneSelectors";
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import AppSettingsPane from "pages/Editor/AppSettingsPane";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import styled from "styled-components";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";

export const PROPERTY_PANE_ID = "t--property-pane-sidebar";

const StyledResizer = styled.div<{ resizing: boolean }>`
  ${(props) =>
    props.resizing &&
    `
  & > div {
    background-color: var(--ads-v2-color-outline);
  }
  `}
  :hover {
    & > div {
      background-color: var(--ads-v2-color-bg-emphasis);
    }
  }
`;

interface Props {
  width: number;
  onDragEnd?: () => void;
  onWidthChange: (width: number) => void;
}

export const PropertyPaneSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevSelectedWidgetId = useRef<string | undefined>();

  const { onMouseDown, onMouseUp, onTouchStart, resizing } =
    useHorizontalResize(sidebarRef, props.onWidthChange, props.onDragEnd, true);

  const selectedWidgetIds = useSelector(getSelectedWidgets);
  const isDraggingOrResizing = useSelector(getIsDraggingOrResizing);
  const isAppSettingsPaneOpen = useSelector(getIsAppSettingsPaneOpen);
  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};

  //while dragging or resizing and
  //the current selected WidgetId is not equal to previous widget id,
  //then don't render PropertyPane
  const shouldNotRenderPane =
    isDraggingOrResizing &&
    selectedWidgetIds[0] !== prevSelectedWidgetId.current;

  // This is to keep the theming properties from changing,
  // while dragging a widget when no other widgets were selected
  const keepThemeWhileDragging =
    prevSelectedWidgetId.current === undefined && shouldNotRenderPane;

  const selectedWidgetsLength = useSelector(
    (state) => selectedWidgetsPresentInCanvas(state).length,
  );

  const isDraggingForSelection = useSelector(getIsDraggingForSelection);

  prevSelectedWidgetId.current =
    selectedWidgetIds.length === 1 ? selectedWidgetIds[0] : undefined;

  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  /**
   * renders the property pane:
   * 1. if isAppSettingsPaneOpen -> AppSettingsPane
   * 2. if no widget is selected -> CanvasPropertyPane
   * 3. if more than one widget is selected -> MultiWidgetPropertyPane
   * 4. if user is dragging for selection -> CanvasPropertyPane
   * 5. if only one widget is selected -> WidgetPropertyPane
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case isAppSettingsPaneOpen:
        return <AppSettingsPane />;
      case selectedWidgetsLength > 1:
        return <MultiSelectPropertyPane />;
      case selectedWidgetsLength === 1:
        if (shouldNotRenderPane) return <CanvasPropertyPane />;
        else return <WidgetPropertyPane />;
      case selectedWidgetsLength === 0:
        return <CanvasPropertyPane />;
      default:
        return <CanvasPropertyPane />;
    }
  }, [
    isAppSettingsPaneOpen,
    selectedWidgetsLength,
    isDraggingForSelection,
    shouldNotRenderPane,
    keepThemeWhileDragging,
  ]);

  const closeWalkthrough = () => {
    if (popFeature) {
      popFeature("PROPERTY_PANE");
      sidebarRef.current?.removeEventListener("click", closeWalkthrough);
    }
  };

  useEffect(() => {
    if (isWalkthroughOpened)
      sidebarRef.current?.addEventListener("click", closeWalkthrough);
    return () => {
      sidebarRef.current?.removeEventListener("click", closeWalkthrough);
    };
  }, [isWalkthroughOpened]);

  return (
    <div className="relative h-full">
      {/* PROPERTY PANE */}
      <div
        className="js-property-pane-sidebar t--property-pane-sidebar flex h-full border-l bg-white"
        id={PROPERTY_PANE_ID}
        ref={sidebarRef}
      >
        {/* RESIZER */}
        {!isAppSettingsPaneOpen && (
          <StyledResizer
            className={`absolute top-0 left-0 w-2 h-full -ml-1 group cursor-ew-resize ${tailwindLayers.resizer}`}
            onMouseDown={onMouseDown}
            onTouchEnd={onMouseUp}
            onTouchStart={onTouchStart}
            resizing={resizing}
          >
            <div
              className={classNames({
                "w-1 h-full bg-transparent transform transition flex items-center":
                  true,
              })}
            />
          </StyledResizer>
        )}
        <div
          className={classNames({
            "h-full p-0 overflow-y-auto min-w-72": true,
            "max-w-104": !isAppSettingsPaneOpen,
            "transition-all duration-100": !resizing,
          })}
          style={{
            width: isAppSettingsPaneOpen
              ? APP_SETTINGS_PANE_WIDTH
              : props.width,
          }}
        >
          {propertyPane}
        </div>
      </div>
    </div>
  );
});

PropertyPaneSidebar.displayName = "PropertyPaneSidebar";

export default Sentry.withProfiler(PropertyPaneSidebar);
