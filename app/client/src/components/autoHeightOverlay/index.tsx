import { focusWidget } from "actions/widgetActions";
import React, {
  CSSProperties,
  memo,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import styled from "styled-components";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
} from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetProps } from "widgets/BaseWidget";
import { GridDefaults, WidgetHeightLimits } from "constants/WidgetConstants";
import { getParentToOpenSelector } from "selectors/widgetSelectors";
import AutoHeightLimitHandleGroup from "./AutoHeightLimitHandleGroup";
import AutoHeightLimitOverlayDisplay from "./ui/AutoHeightLimitOverlayDisplay";
import { useHoverState, usePositionedStyles } from "./hooks";
import { getSnappedValues } from "./utils";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { LayersContext } from "constants/Layers";
import {
  AutoHeightOverlayUIStateReducer,
  createInitialAutoHeightUIState,
} from "./store";
import { previewModeSelector } from "selectors/editorSelectors";

interface StyledAutoHeightOverlayProps {
  layerIndex: number;
  isHidden: boolean;
}

const StyledAutoHeightOverlay = styled.div<StyledAutoHeightOverlayProps>`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: ${(props) => props.layerIndex};
  pointer-events: none;
  display: ${(props) => (props.isHidden ? "none" : "block")};
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

interface AutoHeightOverlayContainerProps
  extends MinMaxHeightProps,
    WidgetProps {
  batchUpdate: (height: number) => void;
  onMaxHeightSet: (height: number) => void;
  onMinHeightSet: (height: number) => void;
  style?: CSSProperties;
}

interface AutoHeightOverlayProps extends AutoHeightOverlayContainerProps {
  isHidden: boolean;
}

const AutoHeightOverlay: React.FC<AutoHeightOverlayProps> = memo(
  ({
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
    const {
      isAutoHeightWithLimitsChanging,
      setIsAutoHeightWithLimitsChanging,
    } = useAutoHeightUIState();

    const [autoHeightUIState, autoHeightUIStateDispatch] = useReducer(
      AutoHeightOverlayUIStateReducer,
      createInitialAutoHeightUIState({ maxDynamicHeight, minDynamicHeight }),
    );

    const {
      isMaxDotDragging,
      isMinDotDragging,
      maxdY,
      maxY,
      mindY,
      minY,
    } = autoHeightUIState;

    function setIsMaxDotDragging(isMaxDotDragging: boolean) {
      autoHeightUIStateDispatch({
        type: "SET_IS_MAX_DOT_DRAGGING",
        payload: {
          isMaxDotDragging,
        },
      });
    }

    function setIsMinDotDragging(isMinDotDragging: boolean) {
      autoHeightUIStateDispatch({
        type: "SET_IS_MIN_DOT_DRAGGING",
        payload: {
          isMinDotDragging,
        },
      });
    }

    function setMaxY(maxY: number) {
      autoHeightUIStateDispatch({
        type: "SET_MAX_Y",
        payload: {
          maxY,
        },
      });
    }

    function setMinY(minY: number) {
      autoHeightUIStateDispatch({
        type: "SET_MIN_Y",
        payload: {
          minY,
        },
      });
    }

    function setMaxdY(maxdY: number) {
      autoHeightUIStateDispatch({
        type: "SET_MAX_D_Y",
        payload: {
          maxdY,
        },
      });
    }

    function setMindY(mindY: number) {
      autoHeightUIStateDispatch({
        type: "SET_MIN_D_Y",
        payload: {
          mindY,
        },
      });
    }

    const finalMaxY = maxY + maxdY;
    const finalMinY = minY + mindY;

    useEffect(() => {
      // reset the diff on backend update
      setMindY(0);
      setMaxdY(0);
      setMaxY(maxDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    }, [maxDynamicHeight]);

    function onAnyDotStop() {
      // Tell the Canvas that we've stopped resizing
      // Put it later in the stack so that other updates like click, are not propagated to the parent container
      setTimeout(() => {
        setIsAutoHeightWithLimitsChanging &&
          setIsAutoHeightWithLimitsChanging(false);
      }, 0);

      selectWidget && selectWidget(props.widgetId);

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
      const snapped = getSnappedValues(dx, dy, snapGrid);

      if (snapped.y === maxdY) {
        return;
      }

      if (
        maxY + dy <=
        (WidgetHeightLimits.MIN_HEIGHT_IN_ROWS + 1) * // now max will always be minimum GridDefaults.DEFAULT_GRID_ROW_HEIGHT + 1 rows
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        return;
      }

      if (maxY + snapped.y <= minY + mindY) {
        setMindY(
          snapped.y + (maxY - minY) - GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        );
      } else {
        // Moving together after min has been decreased
        // while moving with the max
        if (
          snapped.y - maxdY > 0 && // to check whether max is increasing now
          mindY < 0 && // to check whether we want to increase the min because it may have decreased with the max
          maxY + maxdY - GridDefaults.DEFAULT_GRID_ROW_HEIGHT >= minY + mindY // to check whether we still have one row difference
        ) {
          setMindY(Math.min(mindY + (snapped.y - maxdY), 0));
        }
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

      // if dragging the max also changed the min
      // change it only if there is a one row
      // difference
      if (
        mindY !== 0 &&
        maxY + maxdY - (minY + mindY) === GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        updateMinHeight(minY + mindY);
        setMindY(0);
      }

      if (maxdY !== 0) {
        updateMaxHeight(maxY + maxdY);
        setMaxdY(0);
      }

      onAnyDotStop();
    }

    useEffect(() => {
      // reset the diff on backend update
      setMindY(0);
      setMaxdY(0);
      setMinY(minDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    }, [minDynamicHeight]);

    function onMinUpdate(dx: number, dy: number) {
      const snapped = getSnappedValues(dx, dy, snapGrid);

      if (snapped.y === mindY) {
        return;
      }

      if (
        minY + dy <=
        WidgetHeightLimits.MIN_HEIGHT_IN_ROWS *
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        return;
      }

      // Moving together when increasing the min
      if (minY + snapped.y >= maxY + maxdY) {
        setMaxdY(
          GridDefaults.DEFAULT_GRID_ROW_HEIGHT + snapped.y - (maxY - minY),
        );
      } else {
        // Moving together after max has been increased
        // while moving with the min
        if (
          snapped.y - mindY < 0 && // to check whether min is decreasing now
          maxdY > 0 && // to check whether we want to decrease the max because it may have increased with the min
          minY + mindY + GridDefaults.DEFAULT_GRID_ROW_HEIGHT <= maxY + maxdY // to check whether we still have one row difference
        ) {
          setMaxdY(Math.max(maxdY + (snapped.y - mindY), 0));
        }
      }

      setMindY(snapped.y);
    }

    function onMinStop() {
      setIsMinDotDragging(false);

      if (mindY !== 0) {
        updateMinHeight(minY + mindY);
        setMindY(0);
      }

      // if dragging the min also changed the max
      // change it only if there is a one row
      // difference
      if (
        maxdY !== 0 &&
        maxY + maxdY - (minY + mindY) === GridDefaults.DEFAULT_GRID_ROW_HEIGHT
      ) {
        updateMaxHeight(maxY + maxdY);
        setMaxdY(0);
      }

      onAnyDotStop();
    }

    function onMinDotStart() {
      setIsMinDotDragging(true);
      onAnyDotStart();
    }

    function onAnyDotStart() {
      setIsAutoHeightWithLimitsChanging &&
        !isAutoHeightWithLimitsChanging &&
        setIsAutoHeightWithLimitsChanging(true);
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

    const { autoHeightWithLimitsOverlay } = React.useContext(LayersContext);

    return (
      <StyledAutoHeightOverlay
        isHidden={isHidden}
        layerIndex={autoHeightWithLimitsOverlay}
        onClick={(e) => {
          // avoid DropTarget handleFocus
          e.stopPropagation();
        }}
        style={style ?? styles}
      >
        <AutoHeightLimitOverlayDisplay
          data-cy="t--auto-height-overlay-min"
          height={finalMinY}
          isActive={isMinDotDragging || isMinDotActive}
        />
        <AutoHeightLimitOverlayDisplay
          data-cy="t--auto-height-overlay-max"
          height={finalMaxY}
          isActive={isMaxDotDragging || isMaxDotActive}
        />
        <AutoHeightLimitHandleGroup
          isMaxDotActive={isMaxDotDragging || isMaxDotActive}
          isMaxDotDragging={isMaxDotDragging}
          isMinDotActive={isMinDotDragging || isMinDotActive}
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
      </StyledAutoHeightOverlay>
    );
  },
);

const AutoHeightOverlayContainer: React.FC<AutoHeightOverlayContainerProps> = memo(
  (props) => {
    const widgetId = props.widgetId;
    const {
      isDragging,
      isResizing,
      lastSelectedWidget: selectedWidget,
      selectedWidgets,
    } = useSelector((state: AppState) => state.ui.widgetDragResize);

    const isPreviewMode = useSelector(previewModeSelector);

    const isWidgetSelected = selectedWidget === widgetId;
    const multipleWidgetsSelected = selectedWidgets.length > 1;
    const isHidden = multipleWidgetsSelected || isDragging || isResizing;

    if (isWidgetSelected && !isPreviewMode) {
      return <AutoHeightOverlay isHidden={isHidden} {...props} />;
    }

    return null;
  },
);

export default AutoHeightOverlayContainer;
