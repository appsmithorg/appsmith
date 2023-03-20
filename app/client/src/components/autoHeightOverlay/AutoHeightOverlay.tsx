import React, { memo, useCallback, useEffect } from "react";
import styled from "styled-components";
import { GridDefaults } from "constants/WidgetConstants";
import AutoHeightLimitHandleGroup from "./AutoHeightLimitHandleGroup";
import AutoHeightLimitOverlayDisplay from "./ui/AutoHeightLimitOverlayDisplay";
import {
  useAutoHeightOverlayUIStateActions,
  useDragCallbacksForHandles,
  useHoverState,
  usePositionedStyles,
} from "./hooks";
import { LayersContext } from "constants/Layers";
import { useAutoHeightLimitsState } from "./store";
import type { AutoHeightOverlayContainerProps } from ".";

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

export interface AutoHeightOverlayProps
  extends AutoHeightOverlayContainerProps {
  isHidden: boolean;
}

const AutoHeightOverlay: React.FC<AutoHeightOverlayProps> = memo(
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
    const updateMaxHeight = useCallback((height: number) => {
      onMaxHeightSet(height);
    }, []);

    const updateMinHeight = useCallback((height: number) => {
      onMinHeightSet(height);
    }, []);

    const {
      onMaxDotStart,
      onMaxStop,
      onMaxUpdate,
      onMinDotStart,
      onMinStop,
      onMinUpdate,
    } = useDragCallbacksForHandles({
      widgetId: props.widgetId,
      parentColumnSpace: props.parentColumnSpace,
      parentRowSpace: props.parentRowSpace,
      updateMaxHeight,
      updateMinHeight,
      batchUpdate,
    });

    const { isMaxDotDragging, isMinDotDragging, maxdY, maxY, mindY, minY } =
      useAutoHeightLimitsState();

    const { setMaxdY, setMaxY, setMindY, setMinY } =
      useAutoHeightOverlayUIStateActions();

    const finalMaxY = maxY + maxdY;
    const finalMinY = minY + mindY;

    useEffect(() => {
      // reset the diff on backend update
      setMindY(0);
      setMaxdY(0);
      setMaxY(maxDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    }, [maxDynamicHeight]);

    useEffect(() => {
      // reset the diff on backend update
      setMindY(0);
      setMaxdY(0);
      setMinY(minDynamicHeight * GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    }, [minDynamicHeight]);

    const [isMinDotActive, minHoverFns] = useHoverState();
    const [isMaxDotActive, maxHoverFns] = useHoverState();

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
          data-cy="t--auto-height-overlay"
          height={isMaxDotDragging || isMaxDotActive ? finalMaxY : finalMinY}
          isActive={
            isMaxDotDragging ||
            isMaxDotActive ||
            isMinDotDragging ||
            isMinDotActive
          }
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

export default AutoHeightOverlay;
