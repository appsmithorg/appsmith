import { focusWidget } from "actions/widgetActions";
import React, { CSSProperties, memo, useEffect, useMemo } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import styled from "styled-components";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetProps } from "widgets/BaseWidget";
import { GridDefaults, WidgetHeightLimits } from "constants/WidgetConstants";
import { getParentToOpenSelector } from "selectors/widgetSelectors";
import AutoHeightLimitHandleGroup from "./AutoHeightLimitHandleGroup";
import AutoHeightLimitOverlayDisplay from "./ui/AutoHeightLimitOverlayDisplay";
import {
  useHoverState,
  useMaxMinPropertyPaneFieldsFocused,
  usePositionedStyles,
} from "./hooks";
import { getSnappedValues } from "./utils";

const StyledDynamicHeightOverlay = styled.div<{ isHidden: boolean }>`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 3;
  pointer-events: none;
  display: ${(props) => (props.isHidden ? "none" : "block")};
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

interface DynamicHeightOverlayContainerProps
  extends MinMaxHeightProps,
    WidgetProps {
  batchUpdate: (height: number) => void;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  style?: CSSProperties;
}

interface DynamicHeightOverlayProps extends DynamicHeightOverlayContainerProps {
  isHidden: boolean;
}

const DynamicHeightOverlay: React.FC<DynamicHeightOverlayProps> = memo(
  ({
    batchUpdate,
    isHidden,
    maxDynamicHeight,
    minDynamicHeight,
    onMaxHeightSet,
    onMinHeightSet,
    style,
    ...props
  }) => {
    const showPropertyPane = useShowPropertyPane();
    const { selectWidget } = useWidgetSelection();
    const selectedWidget = useSelector(
      (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
    );

    const parentWidgetToSelect = useSelector(
      getParentToOpenSelector(props.widgetId),
    );
    const showTableFilterPane = useShowTableFilterPane();
    const { setIsResizing } = useWidgetDragResize();
    const isResizing = useSelector(
      (state: AppState) => state.ui.widgetDragResize.isResizing,
    );

    const [isMinDotDragging, setIsMinDotDragging] = useState(false);
    const [isMaxDotDragging, setIsMaxDotDragging] = useState(false);

    const [maxY, setMaxY] = useState(maxDynamicHeight * 10);
    const [maxdY, setMaxdY] = useState(0);

    const [minY, setMinY] = useState(minDynamicHeight * 10);
    const [mindY, setMindY] = useState(0);

    const finalMaxY = maxY + maxdY;
    const finalMinY = minY + mindY;

    const {
      isPropertyPaneMaxFieldFocused,
      isPropertyPaneMinFieldFocused,
    } = useMaxMinPropertyPaneFieldsFocused();

    useEffect(() => {
      setMaxY(maxDynamicHeight * 10);
    }, [maxDynamicHeight]);

    function onAnyDotStop() {
      // Tell the Canvas that we've stopped resizing
      // Put it later in the stack so that other updates like click, are not propagated to the parent container
      setTimeout(() => {
        setIsResizing && setIsResizing(false);
      }, 0);
      // Tell the Canvas to put the focus back to this widget
      // By setting the focus, we enable the control buttons on the widget
      selectWidget &&
        selectedWidget !== props.widgetId &&
        parentWidgetToSelect?.widgetId !== props.widgetId &&
        selectWidget(props.widgetId);

      if (parentWidgetToSelect) {
        selectWidget &&
          selectedWidget !== parentWidgetToSelect.widgetId &&
          selectWidget(parentWidgetToSelect.widgetId);
        focusWidget(parentWidgetToSelect.widgetId);
      } else {
        selectWidget &&
          selectedWidget !== props.widgetId &&
          selectWidget(props.widgetId);
      }
      // Property pane closes after a resize/drag
      showPropertyPane && showPropertyPane();
    }

    function onMaxUpdate(dx: number, dy: number) {
      if (
        maxY + dy <=
        WidgetHeightLimits.MIN_HEIGHT_IN_ROWS *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        return;
      }

      const snapped = getSnappedValues(dx, dy, snapGrid);

      if (maxY + snapped.y <= minY) {
        setMindY(snapped.y + (maxY - minY));
      }

      setMaxdY(snapped.y);
    }

    function updateMaxHeight(height: number) {
      setMaxY(height);
      onMaxHeightSet(height);
    }

    function updateMinHeight(height: number) {
      setMinY(height);
      onMinHeightSet(height);
    }

    function onMaxStop() {
      setIsMaxDotDragging(false);
      const heightToSet = maxY + maxdY;

      if (heightToSet === minY + mindY) {
        batchUpdate(heightToSet);
        setMindY(0);
        setMaxdY(0);
      } else {
        updateMaxHeight(heightToSet);
        setMaxdY(0);
      }

      onAnyDotStop();
    }

    useEffect(() => {
      setMinY(minDynamicHeight * 10);
    }, [minDynamicHeight]);

    function onMinUpdate(dx: number, dy: number) {
      if (
        minY + dy <=
        WidgetHeightLimits.MIN_HEIGHT_IN_ROWS *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        return;
      }

      const snapped = getSnappedValues(dx, dy, snapGrid);

      if (minY + snapped.y >= maxY) {
        setMaxdY(snapped.y - (maxY - minY));
      }

      setMindY(snapped.y);
    }

    function onMinStop() {
      setIsMinDotDragging(false);
      const heightToSet = minY + mindY;

      if (heightToSet === maxY + maxdY) {
        batchUpdate(heightToSet);
        setMindY(0);
        setMaxdY(0);
      } else {
        updateMinHeight(heightToSet);
        setMindY(0);
      }

      onAnyDotStop();
    }

    function onMinDotStart() {
      setIsMinDotDragging(true);
      onAnyDotStart();
    }

    function onAnyDotStart() {
      setIsResizing && !isResizing && setIsResizing(true);
      selectWidget &&
        selectedWidget !== props.widgetId &&
        selectWidget(props.widgetId);
      // Make sure that this tableFilterPane should close
      showTableFilterPane && showTableFilterPane();
    }

    function onMaxDotStart() {
      setIsMaxDotDragging(true);
      onAnyDotStart();
    }

    const [isMinDotActive, minHoverFns] = useHoverState();
    const [isMaxDotActive, maxHoverFns] = useHoverState();

    const snapGrid = useMemo(
      () => ({
        x: props.parentColumnSpace,
        y: props.parentRowSpace,
      }),
      [props.parentColumnSpace, props.parentRowSpace],
    );

    const {
      bottomRow,
      leftColumn,
      noContainerOffset,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = props;

    const styles = usePositionedStyles({
      bottomRow,
      leftColumn,
      noContainerOffset,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    });

    return (
      <StyledDynamicHeightOverlay isHidden={isHidden} style={style ?? styles}>
        <AutoHeightLimitOverlayDisplay
          data-cy="t--auto-height-overlay-min"
          isActive={
            isMinDotDragging || isMinDotActive || isPropertyPaneMinFieldFocused
          }
          maxY={finalMinY}
        />
        <AutoHeightLimitOverlayDisplay
          data-cy="t--auto-height-overlay-max"
          isActive={
            isMaxDotDragging || isMaxDotActive || isPropertyPaneMaxFieldFocused
          }
          maxY={finalMaxY}
        />
        <AutoHeightLimitHandleGroup
          isMaxDotActive={
            isMaxDotDragging || isMaxDotActive || isPropertyPaneMaxFieldFocused
          }
          isMaxDotDragging={isMaxDotDragging}
          isMinDotActive={
            isMinDotDragging || isMinDotActive || isPropertyPaneMinFieldFocused
          }
          isMinDotDragging={isMinDotDragging}
          maxY={finalMaxY}
          minY={finalMinY}
          onMaxHeightSet={onMaxHeightSet}
          onMaxLimitDragCallbacks={{
            onUpdate: onMaxUpdate,
            onStop: onMaxStop,
            onStart: onMaxDotStart,
          }}
          onMaxLimitMouseHoverCallbacks={maxHoverFns}
          onMinHeightSet={onMinHeightSet}
          onMinLimitDragCallbacks={{
            onUpdate: onMinUpdate,
            onStop: onMinStop,
            onStart: onMinDotStart,
          }}
          onMinLimitMouseHoverCallbacks={minHoverFns}
        />
      </StyledDynamicHeightOverlay>
    );
  },
);

const DynamicHeightOverlayContainer: React.FC<DynamicHeightOverlayContainerProps> = memo(
  (props) => {
    const widgetId = props.widgetId;
    const {
      isDragging,
      lastSelectedWidget: selectedWidget,
      selectedWidgets,
    } = useSelector((state: AppState) => state.ui.widgetDragResize);

    const isWidgetSelected = selectedWidget === widgetId;
    const multipleWidgetsSelected = selectedWidgets.length > 1;
    const isHidden = multipleWidgetsSelected || isDragging;

    if (isWidgetSelected) {
      return <DynamicHeightOverlay isHidden={isHidden} {...props} />;
    }

    return null;
  },
);

export default DynamicHeightOverlayContainer;
