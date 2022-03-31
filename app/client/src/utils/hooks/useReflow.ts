import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import { OccupiedSpace, WidgetSpace } from "constants/CanvasEditorConstants";
import { isEmpty, throttle } from "lodash";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetSpacesSelectorForContainer } from "selectors/editorSelectors";
import { reflow } from "reflow";
import {
  CollidingSpace,
  GridProps,
  ReflowDirection,
  ReflowedSpaceMap,
} from "reflow/reflowTypes";
import { getLimitedMovementMap } from "reflow/reflowUtils";
import { getBottomRowAfterReflow } from "utils/reflowHookUtils";
import { checkIsDropTarget } from "components/designSystems/appsmith/PositionedContainer";
import { AppState } from "reducers";
import { getIsReflowing } from "selectors/widgetReflowSelectors";

type WidgetCollidingSpace = CollidingSpace & {
  type: string;
};

type WidgetCollidingSpaceMap = {
  [key: string]: WidgetCollidingSpace;
};

export interface ReflowInterface {
  (
    newPositions: OccupiedSpace,
    OGPositions: OccupiedSpace,
    direction: ReflowDirection,
    stopMoveAfterLimit?: boolean,
    shouldSkipContainerReflow?: boolean,
    forceDirection?: boolean,
    immediateExitContainer?: string,
  ): {
    canHorizontalMove: boolean;
    canVerticalMove: boolean;
    movementMap: ReflowedSpaceMap;
    bottomMostRow: number;
  };
}

export const useReflow = (
  widgetId: string,
  parentId: string,
  gridProps: GridProps,
): ReflowInterface => {
  const dispatch = useDispatch();

  const throttledDispatch = throttle(dispatch, 50);

  const isReflowing = useRef<boolean>(false);

  const isReflowingGlobal = useSelector(getIsReflowing);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const reflowSpacesSelector = getWidgetSpacesSelectorForContainer(parentId);
  const widgetSpaces: WidgetSpace[] = useSelector(reflowSpacesSelector) || [];

  const originalSpacePosition = widgetSpaces?.find(
    (space) => space.id === widgetId,
  );

  const reflowingContainers = useRef<{ [key: string]: boolean }>({});

  const prevPositions = useRef<OccupiedSpace | undefined>(
    originalSpacePosition,
  );
  const prevCollidingSpaces = useRef<WidgetCollidingSpaceMap>();
  const prevMovementMap = useRef<ReflowedSpaceMap>({});

  useEffect(() => {
    //only have it run when the user has completely stopped dragging and stopped Reflowing
    if (!isReflowingGlobal && !isDragging) {
      isReflowing.current = false;
      prevCollidingSpaces.current = {};
      prevMovementMap.current = {};
      reflowingContainers.current = {};
    }
  }, [isReflowingGlobal, isDragging]);

  // will become a state if we decide that resize should be a "toggle on-demand" feature
  const shouldResize = true;
  return function reflowSpaces(
    newPositions: OccupiedSpace,
    OGPositions: OccupiedSpace,
    direction: ReflowDirection,
    stopMoveAfterLimit = false,
    shouldSkipContainerReflow = false,
    forceDirection = false,
    immediateExitContainer?: string,
  ) {
    const { collidingSpaceMap, movementLimit, movementMap } = reflow(
      newPositions,
      OGPositions,
      widgetSpaces,
      direction,
      gridProps,
      forceDirection,
      shouldResize,
      immediateExitContainer,
      prevPositions.current,
      prevCollidingSpaces.current,
    );

    prevPositions.current = newPositions;
    prevCollidingSpaces.current = collidingSpaceMap as WidgetCollidingSpaceMap;

    let correctedMovementMap = movementMap || {};

    if (stopMoveAfterLimit)
      correctedMovementMap = getLimitedMovementMap(
        movementMap,
        prevMovementMap.current,
        movementLimit,
      );

    const tempReflowingContainers: { [key: string]: boolean } = {};
    const collidingSpaces = Object.values(
      (collidingSpaceMap as WidgetCollidingSpaceMap) || {},
    );
    for (const collidingSpace of collidingSpaces) {
      if (checkIsDropTarget(collidingSpace.type)) {
        if (
          shouldSkipContainerReflow &&
          !reflowingContainers.current[collidingSpace.id]
        ) {
          correctedMovementMap = {};
        } else {
          tempReflowingContainers[collidingSpace.id] = true;
        }
      }
    }

    reflowingContainers.current = { ...tempReflowingContainers };

    prevMovementMap.current = correctedMovementMap;

    if (!isEmpty(correctedMovementMap)) {
      isReflowing.current = true;
      if (forceDirection) dispatch(reflowMoveAction(correctedMovementMap));
      else throttledDispatch(reflowMoveAction(correctedMovementMap));
    } else if (isReflowing.current) {
      isReflowing.current = false;
      throttledDispatch.cancel();
      dispatch(stopReflowAction());
    }

    const bottomMostRow = getBottomRowAfterReflow(
      movementMap,
      newPositions.bottom,
      widgetSpaces,
      gridProps,
    );

    return {
      ...movementLimit,
      movementMap: correctedMovementMap,
      bottomMostRow,
    };
  };
};
