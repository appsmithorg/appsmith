import { focusWidget } from "actions/widgetActions";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CallbackHandlerEventType } from "utils/CallbackHandler/CallbackHandlerEventType";
import DynamicHeightCallbackHandler from "utils/CallbackHandler/DynamicHeightCallbackHandler";
import { useAutoHeightLimitsDispatch, useAutoHeightLimitsState } from "./store";
import type { onMouseHoverCallbacksProps } from "./types";
import { getSnappedValues } from "./utils";
import type { AppState } from "ee/reducers";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { useSelector } from "react-redux";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
} from "utils/hooks/dragResizeHooks";
import { getParentToOpenSelector } from "selectors/widgetSelectors";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

type UseHoverStateReturnType = [boolean, onMouseHoverCallbacksProps];

export function useHoverState(): UseHoverStateReturnType {
  const [isActive, setIsActive] = useState(false);

  function handleMouseEnter(state: boolean) {
    setIsActive(state);
  }

  return [
    isActive,
    {
      onMouseEnter: () => handleMouseEnter(true),
      onMouseLeave: () => handleMouseEnter(false),
    },
  ];
}

interface UsePositionedStylesProps {
  bottomRow: number;
  leftColumn: number;
  noContainerOffset?: boolean;
  parentColumnSpace: number;
  parentRowSpace: number;
  rightColumn: number;
  topRow: number;
}

export const usePositionedStyles = ({
  bottomRow,
  leftColumn,
  noContainerOffset,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: UsePositionedStylesProps) => {
  const styles: CSSProperties = useMemo(
    () => ({
      height: (bottomRow - topRow) * parentRowSpace,
      width: (rightColumn - leftColumn) * parentColumnSpace,
      left:
        leftColumn * parentColumnSpace +
        (noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
      top:
        topRow * parentRowSpace +
        (noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
    }),
    [
      bottomRow,
      leftColumn,
      noContainerOffset,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    ],
  );

  return styles;
};

export const useMaxMinPropertyPaneFieldsFocused = () => {
  const [isPropertyPaneMinFieldFocused, setPropertyPaneMinFieldFocused] =
    useState(false);

  const [isPropertyPaneMaxFieldFocused, setPropertyPaneMaxFieldFocused] =
    useState(false);

  function handleOnMaxLimitPropertyPaneFieldFocus() {
    setPropertyPaneMaxFieldFocused(true);
  }

  function handleOnMaxLimitPropertyPaneFieldBlur() {
    setPropertyPaneMaxFieldFocused(false);
  }

  function handleOnMinLimitPropertyPaneFieldFocus() {
    setPropertyPaneMinFieldFocused(true);
  }

  function handleOnMinLimitPropertyPaneFieldBlur() {
    setPropertyPaneMinFieldFocused(false);
  }

  useEffect(() => {
    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MAX_HEIGHT_LIMIT_FOCUS,
      handleOnMaxLimitPropertyPaneFieldFocus,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MAX_HEIGHT_LIMIT_BLUR,
      handleOnMaxLimitPropertyPaneFieldBlur,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MIN_HEIGHT_LIMIT_FOCUS,
      handleOnMinLimitPropertyPaneFieldFocus,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MIN_HEIGHT_LIMIT_BLUR,
      handleOnMinLimitPropertyPaneFieldBlur,
    );

    return () => {
      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MAX_HEIGHT_LIMIT_FOCUS,
        handleOnMaxLimitPropertyPaneFieldFocus,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MAX_HEIGHT_LIMIT_BLUR,
        handleOnMaxLimitPropertyPaneFieldBlur,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MIN_HEIGHT_LIMIT_FOCUS,
        handleOnMinLimitPropertyPaneFieldFocus,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MIN_HEIGHT_LIMIT_BLUR,
        handleOnMinLimitPropertyPaneFieldBlur,
      );
    };
  }, []);

  return {
    isPropertyPaneMaxFieldFocused,
    isPropertyPaneMinFieldFocused,
  };
};

export function useAutoHeightOverlayUIStateActions() {
  const autoHeightUIDispatch = useAutoHeightLimitsDispatch();

  const setIsMaxDotDragging = useCallback((isMaxDotDragging: boolean) => {
    autoHeightUIDispatch({
      type: "SET_IS_MAX_DOT_DRAGGING",
      payload: {
        isMaxDotDragging,
      },
    });
  }, []);

  const setIsMinDotDragging = useCallback((isMinDotDragging: boolean) => {
    autoHeightUIDispatch({
      type: "SET_IS_MIN_DOT_DRAGGING",
      payload: {
        isMinDotDragging,
      },
    });
  }, []);

  const setMaxY = useCallback((maxY: number) => {
    autoHeightUIDispatch({
      type: "SET_MAX_Y",
      payload: {
        maxY,
      },
    });
  }, []);

  const setMinY = useCallback((minY: number) => {
    autoHeightUIDispatch({
      type: "SET_MIN_Y",
      payload: {
        minY,
      },
    });
  }, []);

  const setMaxdY = useCallback((maxdY: number) => {
    autoHeightUIDispatch({
      type: "SET_MAX_D_Y",
      payload: {
        maxdY,
      },
    });
  }, []);

  const setMindY = useCallback((mindY: number) => {
    autoHeightUIDispatch({
      type: "SET_MIN_D_Y",
      payload: {
        mindY,
      },
    });
  }, []);

  return {
    setIsMaxDotDragging,
    setMaxY,
    setMaxdY,
    setIsMinDotDragging,
    setMinY,
    setMindY,
  };
}

export function useDragCallbacksForHandles({
  batchUpdate,
  parentColumnSpace,
  parentRowSpace,
  updateMaxHeight,
  updateMinHeight,
  widgetId,
}: {
  widgetId: string;
  parentColumnSpace: number;
  parentRowSpace: number;
  updateMaxHeight: (height: number) => void;
  updateMinHeight: (height: number) => void;
  batchUpdate: (options: { maxHeight?: number; minHeight?: number }) => void;
}) {
  const { selectWidget } = useWidgetSelection();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const showPropertyPane = useShowPropertyPane();

  const parentWidgetToSelect = useSelector(getParentToOpenSelector(widgetId));

  const showTableFilterPane = useShowTableFilterPane();
  const { isAutoHeightWithLimitsChanging, setIsAutoHeightWithLimitsChanging } =
    useAutoHeightUIState();

  const { maxdY, maxY, mindY, minY } = useAutoHeightLimitsState();

  const { setIsMaxDotDragging, setIsMinDotDragging, setMaxdY, setMindY } =
    useAutoHeightOverlayUIStateActions();

  const snapGrid = useMemo(
    () => ({
      x: parentColumnSpace,
      y: parentRowSpace,
    }),
    [parentColumnSpace, parentRowSpace],
  );

  const onAnyDotStart = useCallback(() => {
    setIsAutoHeightWithLimitsChanging &&
      !isAutoHeightWithLimitsChanging &&
      setIsAutoHeightWithLimitsChanging(true);
    selectWidget &&
      selectedWidget !== widgetId &&
      selectWidget(SelectionRequestType.One, [widgetId]);
    // Make sure that this tableFilterPane should close
    showTableFilterPane && showTableFilterPane();
  }, [widgetId]);

  const onAnyDotStop = useCallback(() => {
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsAutoHeightWithLimitsChanging &&
        setIsAutoHeightWithLimitsChanging(false);
    }, 0);

    selectWidget && selectWidget(SelectionRequestType.One, [widgetId]);

    if (parentWidgetToSelect) {
      selectWidget &&
        selectedWidget !== parentWidgetToSelect.widgetId &&
        selectWidget(SelectionRequestType.One, [parentWidgetToSelect.widgetId]);
      focusWidget(parentWidgetToSelect.widgetId);
    } else {
      selectWidget &&
        selectedWidget !== widgetId &&
        selectWidget(SelectionRequestType.One, [widgetId]);
    }
    // Property pane closes after a resize/drag
    showPropertyPane && showPropertyPane();
  }, [widgetId]);

  const onMaxUpdate = useCallback(
    (dx: number, dy: number) => {
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
    },
    [maxdY, maxY, minY, mindY],
  );

  const onMinUpdate = useCallback(
    (dx: number, dy: number) => {
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
    },
    [snapGrid, minY, maxY, maxdY, mindY],
  );

  const onMinDotStart = useCallback(() => {
    setIsMinDotDragging(true);
    onAnyDotStart();
  }, []);

  const onMaxDotStart = useCallback(() => {
    setIsMaxDotDragging(true);
    onAnyDotStart();
  }, []);

  function tryBatchUpdateIfPossible(): boolean {
    // if there are changes to both
    // use batch
    if (mindY !== 0 && maxdY !== 0) {
      batchUpdate({
        maxHeight: maxY + maxdY,
        minHeight: minY + mindY,
      });
      return true;
    }

    return false;
  }

  function onMaxStop() {
    setIsMaxDotDragging(false);

    if (!tryBatchUpdateIfPossible()) {
      // since no batch update
      // update only max
      if (maxdY !== 0) {
        updateMaxHeight(maxY + maxdY);
      }
    }

    onAnyDotStop();
  }

  function onMinStop() {
    setIsMinDotDragging(false);

    if (!tryBatchUpdateIfPossible()) {
      // since no batch update
      // update only max
      if (mindY !== 0) {
        updateMinHeight(minY + mindY);
      }
    }

    onAnyDotStop();
  }

  return {
    onMaxDotStart,
    onMinDotStart,
    onMaxUpdate,
    onMinUpdate,
    onMinStop,
    onMaxStop,
  };
}
