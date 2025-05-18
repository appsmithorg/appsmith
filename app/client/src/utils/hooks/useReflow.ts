import type { DefaultRootState } from "react-redux";
import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import { isEmpty, throttle } from "lodash";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { reflow } from "reflow";
import type {
  BlockSpace,
  CollidingSpace,
  CollidingSpaceMap,
  GridProps,
  MovementLimitMap,
  PrevReflowState,
  ReflowDirection,
  ReflowedSpaceMap,
  SecondOrderCollisionMap,
  SpaceMap,
} from "reflow/reflowTypes";
import {
  getBottomMostRow,
  getLimitedMovementMap,
  getSpacesMapFromArray,
  willItCauseUndroppableState,
} from "reflow/reflowUtils";
import { isCurrentCanvasDragging } from "sagas/selectors";
import { getContainerWidgetSpacesSelectorWhileMoving } from "selectors/editorSelectors";
import { getIsReflowing } from "selectors/widgetReflowSelectors";
import { getIsResizing } from "selectors/widgetSelectors";
import { getBottomRowAfterReflow } from "utils/reflowHookUtils";

type WidgetCollidingSpace = CollidingSpace & {
  type: string;
  isDropTarget: boolean;
};

interface WidgetCollidingSpaceMap {
  horizontal: WidgetCollisionMap;
  vertical: WidgetCollisionMap;
}
export interface WidgetCollisionMap {
  [key: string]: WidgetCollidingSpace;
}

export interface ReflowInterface {
  (
    newPositions: BlockSpace[],
    direction: ReflowDirection,
    stopMoveAfterLimit?: boolean,
    shouldSkipContainerReflow?: boolean,
    forceDirection?: boolean,
    immediateExitContainer?: string,
    mousePosition?: OccupiedSpace,
    reflowAfterTimeoutCallback?: (reflowParams: {
      movementMap: ReflowedSpaceMap;
      spacePositionMap: SpaceMap | undefined;
      movementLimitMap: MovementLimitMap | undefined;
    }) => void,
  ): {
    movementLimitMap?: MovementLimitMap;
    movementMap: ReflowedSpaceMap;
    bottomMostRow: number;
    spacePositionMap: SpaceMap | undefined;
  };
}

export const useReflow = (
  OGPositions: OccupiedSpace[],
  parentId: string,
  gridProps: GridProps,
  shouldResize = true,
): { reflowSpaces: ReflowInterface; resetReflow: () => void } => {
  const dispatch = useDispatch();
  const isReflowingGlobal = useSelector(getIsReflowing);

  const isDraggingCanvas = useSelector((state: DefaultRootState) =>
    isCurrentCanvasDragging(state, parentId),
  );
  const isResizing = useSelector(getIsResizing);

  const isCanvasDraggingOrResizing = isDraggingCanvas || isResizing;

  const throttledDispatch = throttle(dispatch, 50);

  const isReflowing = useRef<boolean>(false);

  const reflowSpacesSelector =
    getContainerWidgetSpacesSelectorWhileMoving(parentId);
  const widgetSpaces: WidgetSpace[] = useSelector(reflowSpacesSelector) || [];

  // Store previous values of reflow results
  const prevPositions = useRef<OccupiedSpace[] | undefined>(OGPositions);
  const prevCollidingSpaces = useRef<WidgetCollidingSpaceMap>();
  const prevMovementMap = useRef<ReflowedSpaceMap>({});
  const prevSecondOrderCollisionMap = useRef<SecondOrderCollisionMap>({});

  // Indicates if the Containers should be reflowed
  const shouldReflowDropTargets = useRef<boolean>(false);
  // ref of timeout method
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeOutFunction = useRef<any>();
  // store exit container and mouse position at exit, so that it can be used during timeout
  const exitContainer = useRef<string | undefined>(undefined);
  const mousePointerAtContainerExit = useRef<OccupiedSpace | undefined>(
    undefined,
  );

  useEffect(() => {
    //only have it run when the user has completely stopped dragging and stopped Reflowing
    if (!isReflowingGlobal && !isCanvasDraggingOrResizing) {
      isReflowing.current = false;
      prevPositions.current = [...OGPositions];
      prevCollidingSpaces.current = { horizontal: {}, vertical: {} };
      prevMovementMap.current = {};
      prevSecondOrderCollisionMap.current = {};
      shouldReflowDropTargets.current = false;
    }

    if (!isCanvasDraggingOrResizing) {
      clearTimeout(timeOutFunction.current);
      exitContainer.current = undefined;
      mousePointerAtContainerExit.current = undefined;
    }
  }, [isReflowingGlobal, isCanvasDraggingOrResizing]);

  // will become a state if we decide that resize should be a "toggle on-demand" feature
  return {
    reflowSpaces: (
      newPositions: BlockSpace[],
      direction: ReflowDirection,
      stopMoveAfterLimit = false,
      shouldSkipContainerReflow = false,
      forceDirection = false,
      immediateExitContainer?: string,
      mousePosition?: OccupiedSpace,
      reflowAfterTimeoutCallback?: (reflowParams: {
        movementMap: ReflowedSpaceMap;
        spacePositionMap: SpaceMap | undefined;
        movementLimitMap: MovementLimitMap | undefined;
      }) => void,
    ) => {
      clearTimeout(timeOutFunction.current);

      const prevReflowState: PrevReflowState = {
        prevSpacesMap: getSpacesMapFromArray(prevPositions.current),
        prevCollidingSpaceMap: prevCollidingSpaces.current as CollidingSpaceMap,
        prevMovementMap: prevMovementMap.current,
        prevSecondOrderCollisionMap: prevSecondOrderCollisionMap.current,
      };

      const {
        collidingSpaceMap,
        movementLimitMap,
        movementMap,
        secondOrderCollisionMap,
        shouldRegisterContainerTimeout,
        spacePositionMap,
      } = reflow(
        newPositions,
        OGPositions,
        widgetSpaces,
        direction,
        gridProps,
        forceDirection,
        shouldResize,
        prevReflowState,
        immediateExitContainer,
        mousePosition,
        !shouldSkipContainerReflow || shouldReflowDropTargets.current,
      );

      prevPositions.current = newPositions;
      prevCollidingSpaces.current =
        collidingSpaceMap as WidgetCollidingSpaceMap;
      prevSecondOrderCollisionMap.current = secondOrderCollisionMap || {};

      //store exit container and mouse pointer if we are not reflowing drop targets and it doesn't already have a value
      if (!shouldReflowDropTargets.current && !exitContainer.current) {
        exitContainer.current = immediateExitContainer;
        mousePointerAtContainerExit.current = mousePosition;
      }

      let correctedMovementMap = movementMap || {};

      if (stopMoveAfterLimit) {
        correctedMovementMap = getLimitedMovementMap(
          movementMap,
          prevMovementMap.current,
          { canHorizontalMove: true, canVerticalMove: true },
        );
      }

      prevMovementMap.current = correctedMovementMap;
      const collidingSpaces = [
        ...Object.values(collidingSpaceMap?.horizontal || []),
        ...Object.values(collidingSpaceMap?.vertical || []),
      ] as WidgetCollidingSpace[];

      // Logic for container jump
      if (shouldSkipContainerReflow) {
        if (shouldRegisterContainerTimeout) {
          // register a timeout method to trigger reflow if widget is not moved and is colliding with Droptargets
          timeOutFunction.current = setTimeout(() => {
            //call reflow again
            const {
              collidingSpaceMap,
              movementLimitMap,
              movementMap,
              secondOrderCollisionMap,
            } = reflow(
              newPositions,
              OGPositions,
              widgetSpaces,
              direction,
              gridProps,
              forceDirection,
              shouldResize,
              prevReflowState,
              exitContainer.current,
              mousePointerAtContainerExit.current || mousePosition,
              true,
              true,
            );

            exitContainer.current = undefined;
            mousePointerAtContainerExit.current = undefined;

            //if the result causes an undroppable state return
            if (willItCauseUndroppableState(movementLimitMap)) return;

            // trigger reflow action with result of reflow algorithm
            if (!isEmpty(movementMap)) {
              shouldReflowDropTargets.current = true;
              isReflowing.current = true;
              dispatch(reflowMoveAction(movementMap || {}));
              //trigger callback if reflow action is called
              reflowAfterTimeoutCallback &&
                reflowAfterTimeoutCallback({
                  movementMap: prevMovementMap.current,
                  spacePositionMap: undefined,
                  movementLimitMap,
                });

              prevCollidingSpaces.current =
                collidingSpaceMap as WidgetCollidingSpaceMap;
              prevSecondOrderCollisionMap.current =
                secondOrderCollisionMap || {};
              prevMovementMap.current = movementMap || {};
            } else if (isReflowing.current) {
              isReflowing.current = false;
              throttledDispatch.cancel();
              dispatch(stopReflowAction());
              shouldReflowDropTargets.current = false;
            }
          }, 500);
        } // This checks if colliding space does not contain any drop targets
        else if (
          !collidingSpaces.some(
            (collidingSpaces) => collidingSpaces.isDropTarget,
          )
        ) {
          shouldReflowDropTargets.current = false;
          mousePointerAtContainerExit.current = undefined;
          exitContainer.current = undefined;
        }
      }

      //Trigger reflow action
      if (!isEmpty(correctedMovementMap)) {
        isReflowing.current = true;

        if (forceDirection) dispatch(reflowMoveAction(correctedMovementMap));
        else throttledDispatch(reflowMoveAction(correctedMovementMap));
      } else if (isReflowing.current) {
        isReflowing.current = false;
        throttledDispatch.cancel();
        dispatch(stopReflowAction());
        shouldReflowDropTargets.current = false;
      }

      //calculate bottom row
      const bottomMostRow = getBottomRowAfterReflow(
        movementMap,
        getBottomMostRow(newPositions),
        widgetSpaces,
        gridProps,
      );

      return {
        movementLimitMap,
        movementMap: correctedMovementMap,
        bottomMostRow,
        spacePositionMap,
      };
    },
    //reset Reflow parameters when this is called, usually while resetting  canvas
    resetReflow: () => {
      clearTimeout(timeOutFunction.current);
      shouldReflowDropTargets.current = false;
      mousePointerAtContainerExit.current = undefined;
      exitContainer.current = undefined;
    },
  };
};
