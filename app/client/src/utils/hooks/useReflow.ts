import { reflowMove, stopReflow } from "actions/reflowActions";
import { OccupiedSpace, WidgetSpace } from "constants/CanvasEditorConstants";
import { isEmpty, throttle } from "lodash";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetSpacesSelectorForContainer } from "selectors/editorSelectors";
import { getShouldResize } from "selectors/widgetReflowSelectors";
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

type WidgetCollidingSpace = CollidingSpace & {
  type: string;
};

type WidgetCollidingSpaceMap = {
  [key: string]: WidgetCollidingSpace;
};

export const useReflow = (
  widgetId: string,
  parentId: string,
  gridProps: GridProps,
) => {
  const dispatch = useDispatch();

  const throttledDispatch = throttle(dispatch, 50);

  const isReflowing = useRef<boolean>(false);

  const shouldResize = useSelector(getShouldResize);
  const reflowSpacesSelector = getWidgetSpacesSelectorForContainer(parentId);
  const widgetSpaces: WidgetSpace[] = useSelector(reflowSpacesSelector) || [];

  const originalSpacePosition = widgetSpaces?.find(
    (space) => space.id === widgetId,
  );

  const prevPositions = useRef<OccupiedSpace | undefined>(
    originalSpacePosition,
  );
  const prevCollidingSpaces = useRef<WidgetCollidingSpaceMap>();
  const prevMovementMap = useRef<ReflowedSpaceMap>({});

  return function reflowSpaces(
    newPositions: OccupiedSpace,
    OGPositions: OccupiedSpace,
    direction: ReflowDirection,
    stopMoveAfterLimit = false,
    shouldSkipContainerReflow = false,
    forceDirection = false,
  ) {
    //eslint-disable-next-line
    console.log("reflow New Positions", newPositions, direction);
    const { collidingSpaceMap, movementLimit, movementMap } = reflow(
      newPositions,
      OGPositions,
      widgetSpaces,
      direction,
      gridProps,
      forceDirection,
      shouldResize,
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

    if (shouldSkipContainerReflow) {
      const collidingSpaces = Object.values(
        (collidingSpaceMap as WidgetCollidingSpaceMap) || {},
      );
      for (const collidingSpace of collidingSpaces) {
        if (checkIsDropTarget(collidingSpace.type)) {
          correctedMovementMap = {};
        }
      }
    }

    prevMovementMap.current = correctedMovementMap;

    if (!isEmpty(correctedMovementMap)) {
      isReflowing.current = true;
      throttledDispatch(reflowMove(correctedMovementMap));
    } else if (isReflowing.current) {
      isReflowing.current = false;
      throttledDispatch.cancel();
      dispatch(stopReflow());
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
