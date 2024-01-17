import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { type MutableRefObject, useEffect, useRef } from "react";
import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";
import { useDispatch } from "react-redux";
import { AnvilReduxActionTypes } from "../integrations/actions/actionTypes";

interface SpaceDistributionEventsProps {
  ref: React.RefObject<HTMLDivElement>;
  spaceDistributed: { [key: string]: number };
  leftZone: string;
  rightZone: string;
  columnPosition: number;
  sectionLayoutId: string;
  isCurrentHandleDistributingSpace: React.MutableRefObject<boolean>;
  spaceToWorkWith: number;
}
const shrinkablePixels = 10;
const minimumMouseMoveRequirement = 3;
let lastMouseX: number | null = null;
let lastMouseY: number | null = null;
let lastTimestamp: number | null = null;
let mouseStoppedTimer: ReturnType<typeof setTimeout> | null = null;
const getMouseSpeedTrackingCallback = (
  currentMouseSpeed: MutableRefObject<number>,
) => {
  const resetSpeed = () => {
    currentMouseSpeed.current = 0;
  };
  return function (event: MouseEvent) {
    const currentMouseX = event.clientX;
    const currentMouseY = event.clientY;
    const currentTimestamp = Date.now();

    if (lastMouseX !== null && lastMouseY !== null && lastTimestamp !== null) {
      const distanceX = currentMouseX - lastMouseX;
      const distanceY = currentMouseY - lastMouseY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2); // Euclidean distance
      const timeElapsed = (currentTimestamp - lastTimestamp) / 1000; // Convert to seconds

      const speed = distance / timeElapsed;
      currentMouseSpeed.current = speed;
      if (mouseStoppedTimer) {
        // Reset the timer when the mouse moves
        clearTimeout(mouseStoppedTimer);
      }
      mouseStoppedTimer = setTimeout(resetSpeed, 1000);
    }

    lastMouseX = currentMouseX;
    lastMouseY = currentMouseY;
    lastTimestamp = currentTimestamp;
  };
};
let prevX = 0;
const getMouseDirectionCallback = (
  currentMouseDirection: MutableRefObject<"left" | "right" | undefined>,
) => {
  return (event: MouseEvent) => {
    const { clientX } = event;

    // Check if the change in position exceeds the threshold
    if (Math.abs(clientX - prevX) >= minimumMouseMoveRequirement) {
      if (clientX > prevX) {
        currentMouseDirection.current = "right";
      } else if (clientX < prevX) {
        currentMouseDirection.current = "left";
      }
      // Update the previous position
      prevX = clientX;
    }
  };
};

const updatedCSSOfWidgetsOnHittingMinimumLimit = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  leftZoneDom: HTMLElement,
  rightZoneDom: HTMLElement,
  minSpacePerBlock: number,
  currentFlexGrow: { [key: string]: number },
  currentGrowthFactor: { [key: string]: number },
  minimumShrinkableSpacePerBlock: number,
) => {
  const totalSpace = currentFlexGrow.leftZone + currentFlexGrow.rightZone;
  const spaceForTheZoneOtherThanShrunkenZone = totalSpace - minSpacePerBlock;
  // If one or both zones don't have enough space, set them to the minimum shrinkable space
  if (leftZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    leftZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
    rightZoneDom.style.flexGrow = (
      totalSpace - minimumShrinkableSpacePerBlock
    ).toString();
    currentGrowthFactor.leftZone = minSpacePerBlock;
    currentGrowthFactor.rightZone = spaceForTheZoneOtherThanShrunkenZone;
  } else if (rightZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    rightZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
    leftZoneDom.style.flexGrow = (
      totalSpace - minimumShrinkableSpacePerBlock
    ).toString();
    currentGrowthFactor.leftZone = spaceForTheZoneOtherThanShrunkenZone;
    currentGrowthFactor.rightZone = minSpacePerBlock;
  }
};
const maxSpeedLimit = 4000;
const baseAnimationDuration = 0.25;
const ratioOfSpeedToAnimation = baseAnimationDuration / maxSpeedLimit;
const checkForNeedToAddMagneticForce = (
  mouseSpeed: number,
  leftZoneDom: HTMLElement,
  rightZoneDom: HTMLElement,
  leftZoneComputedColumnsRoundOff: number,
  rightZoneComputedColumnsRoundOff: number,
) => {
  leftZoneDom.style.transition = `all ${
    baseAnimationDuration -
    Math.min(mouseSpeed, maxSpeedLimit) * ratioOfSpeedToAnimation
  }s ease-in-out`;
  rightZoneDom.style.transition = `all ${
    baseAnimationDuration -
    Math.min(mouseSpeed, maxSpeedLimit) * ratioOfSpeedToAnimation
  }s ease-in-out`;
  leftZoneDom.style.flexGrow = leftZoneComputedColumnsRoundOff.toString();
  rightZoneDom.style.flexGrow = rightZoneComputedColumnsRoundOff.toString();
};
const updatedCSSOfWidgetsOnHandleMove = (
  ref: React.RefObject<HTMLDivElement>,
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  leftZoneDom: HTMLElement,
  rightZoneDom: HTMLElement,
  minSpacePerBlock: number,
  currentFlexGrow: { [key: string]: number },
  currentGrowthFactor: { [key: string]: number },
  leftZoneComputedColumnsRoundOff: number,
  rightZoneComputedColumnsRoundOff: number,
  columnIndicatorDivRef: MutableRefObject<HTMLDivElement | undefined>,
  columnPosition: number,
  mouseSpeed: number,
) => {
  checkForNeedToAddResistiveForce(
    leftZoneComputedColumns,
    rightZoneComputedColumns,
    leftZoneDom,
    rightZoneDom,
    minSpacePerBlock,
    ref,
  );
  checkForNeedToAddMagneticForce(
    mouseSpeed,
    leftZoneDom,
    rightZoneDom,
    leftZoneComputedColumnsRoundOff,
    rightZoneComputedColumnsRoundOff,
  );

  // note down the new growth factor for the zones
  currentGrowthFactor.leftZone = leftZoneComputedColumnsRoundOff;
  currentGrowthFactor.rightZone = rightZoneComputedColumnsRoundOff;

  // Update the column indicator text to reflect the new column positions
  if (columnIndicatorDivRef.current) {
    columnIndicatorDivRef.current.innerHTML = `${
      columnPosition -
      currentFlexGrow.leftZone +
      leftZoneComputedColumnsRoundOff
    } / ${SectionColumns}`;
  }
};

// Reset CSS styles for the handle when not in use
const resetHandleCSS = (ref: React.RefObject<HTMLDivElement>) => {
  if (ref.current) {
    ref.current.style.transition = "";
    ref.current.classList.remove("active");
    ref.current.style.left = "";
    ref.current.style.display = "none";
  }
};

// Reset CSS styles for all zones
const resetCSSOnZones = (spaceDistributed: { [key: string]: number }) => {
  Object.keys(spaceDistributed).forEach((zoneId) => {
    const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
    if (zoneDom) {
      zoneDom.style.flexGrow = "";
      zoneDom.style.transition = "all 0.3s ease";
      setTimeout(() => {
        zoneDom.style.transition = "";
      }, 500);
    }
  });
};

// Create a visual column indicator
// const createColumnIndicator = (
//   columnPosition: number,
//   columnIndicatorDivRef: MutableRefObject<HTMLDivElement | undefined>,
// ) => {
//   const columnIndicatorDiv = document.createElement("div");
//   // Display the current column position and total columns
//   columnIndicatorDiv.innerHTML = `${columnPosition} / ${SectionColumns}`;
//   columnIndicatorDiv.style.position = "absolute";
//   // Styling for the indicator
//   columnIndicatorDiv.style.background = "white";
//   columnIndicatorDiv.style.color = "black";
//   columnIndicatorDiv.style.padding = "2px";
//   columnIndicatorDiv.style.borderRadius = "2px";
//   columnIndicatorDiv.style.boxShadow = "0px 0px 2px 2px black";
//   columnIndicatorDiv.style.zIndex = "1000";
//   columnIndicatorDiv.style.fontSize = "10px";
//   columnIndicatorDiv.style.fontWeight = "bold";
//   document.body.appendChild(columnIndicatorDiv);
//   columnIndicatorDivRef.current = columnIndicatorDiv;
// };

// Remove the visual column indicator
// const removeColumnIndicator = (
//   columnIndicatorDivRef: MutableRefObject<HTMLDivElement | undefined>,
// ) => {
//   if (columnIndicatorDivRef.current) {
//     columnIndicatorDivRef.current.remove();
//     columnIndicatorDivRef.current = undefined;
//   }
// };

// Reposition the column indicator based on mouse movement
// const repositionColumnIndicator = (
//   columnIndicatorDivRef: MutableRefObject<HTMLDivElement | undefined>,
//   e: MouseEvent,
// ) => {
//   if (columnIndicatorDivRef.current) {
//     columnIndicatorDivRef.current.style.left =
//       e.clientX + shrinkablePixels + "px";
//     columnIndicatorDivRef.current.style.top =
//       e.clientY - shrinkablePixels + "px";
//   }
// };

// Check if resistive force is needed for the zones
const checkForNeedToAddResistiveForce = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  leftZoneDom: HTMLElement,
  rightZoneDom: HTMLElement,
  minSpacePerBlock: number,
  ref: React.RefObject<HTMLDivElement>,
) => {
  if (ref.current) {
    // Check if the zones are below the minimum space
    const isLeftZoneLessThanMinimum =
      leftZoneComputedColumns <= minSpacePerBlock;
    const isRightZoneLessThanMinimum =
      rightZoneComputedColumns <= minSpacePerBlock;

    // Apply transition if zones are below the minimum space, else remove transition
    if (isLeftZoneLessThanMinimum || isRightZoneLessThanMinimum) {
      leftZoneDom.style.transition = `all ${baseAnimationDuration}s ease`;
      rightZoneDom.style.transition = `all ${baseAnimationDuration}s ease`;
    } else {
      leftZoneDom.style.transition = "";
      rightZoneDom.style.transition = "";
    }
  }
};

export const useSpaceDistributionEvents = ({
  columnPosition,
  isCurrentHandleDistributingSpace,
  leftZone,
  ref,
  rightZone,
  sectionLayoutId,
  spaceDistributed,
  spaceToWorkWith,
}: SpaceDistributionEventsProps) => {
  const dispatch = useDispatch();
  const columnIndicatorDivRef = useRef<HTMLDivElement>();
  const minSpacePerBlock = ZoneMinColumnWidth;
  const columnWidth = spaceToWorkWith / SectionColumns;
  const minLimitBounceBackThreshold = shrinkablePixels / columnWidth;
  const minimumShrinkableSpacePerBlock =
    minSpacePerBlock - minLimitBounceBackThreshold;
  const currentMouseSpeed = useRef(0);
  const currentMouseDirection = useRef<"left" | "right">();

  const mouseSpeedTrackingCallback =
    getMouseSpeedTrackingCallback(currentMouseSpeed);
  const mouseDirectionCallback = getMouseDirectionCallback(
    currentMouseDirection,
  );
  useEffect(() => {
    if (ref.current) {
      // Check if the ref to the DOM element exists
      // Initial position of the mouse
      let x = 0;

      // Get the current flex-grow values for the left and right zones
      const currentFlexGrow = {
        leftZone: spaceDistributed[leftZone],
        rightZone: spaceDistributed[rightZone],
      };

      // Retrieve DOM elements for the left and right zones
      const leftZoneDom = document.getElementById(
        getAnvilWidgetDOMId(leftZone),
      );
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );

      // Keep track of the growth factors for both zones
      const currentGrowthFactor = {
        leftZone: currentFlexGrow.leftZone,
        rightZone: currentFlexGrow.rightZone,
      };

      // Reference to the parent layout DOM element
      const sectionLayoutDom = ref.current.parentElement;

      // Function to add mouse move event handlers
      const addMouseMoveHandlers = () => {
        // Add visual feedback for the handle's active state
        if (ref.current && sectionLayoutDom) {
          ref.current.classList.add("active");
        }

        // Update flex-grow values for all distributed zones
        Object.entries(spaceDistributed).forEach(([zoneId, flexGrow]) => {
          const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
          if (zoneDom) {
            zoneDom.style.flexGrow = flexGrow.toString();
          }
        });

        // Add event listeners for mouseup and mousemove events
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mousemove", mouseSpeedTrackingCallback);
        document.addEventListener("mousemove", mouseDirectionCallback);
      };

      // Remove mouse move event handlers
      const removeMouseMoveHandlers = () => {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mousemove", mouseSpeedTrackingCallback);
        document.removeEventListener("mousemove", mouseDirectionCallback);
      };

      // Callback when CSS transition ends
      const onCSSTransitionEnd = () => {
        // Check if growth factors have changed
        if (
          currentFlexGrow.leftZone !== currentGrowthFactor.leftZone ||
          currentFlexGrow.rightZone !== currentGrowthFactor.rightZone
        ) {
          // Dispatch action to update space distribution
          dispatch({
            type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_UPDATE,
            payload: {
              zonesDistributed: {
                [leftZone]: currentGrowthFactor.leftZone,
                [rightZone]: currentGrowthFactor.rightZone,
              },
              sectionLayoutId,
            },
          });
        }
        // Stop space distribution process
        dispatch({
          type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP,
        });
        resetCSSOnZones(spaceDistributed);
        removeMouseMoveHandlers();
        currentMouseSpeed.current = 0;
        if (ref.current) {
          ref.current.removeEventListener("transitionend", onCSSTransitionEnd);
        }
      };

      // Callback when mouse button is pressed down
      const onMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        x = e.clientX; // Store the initial mouse position
        isCurrentHandleDistributingSpace.current = true; // Set distribution flag
        dispatch({
          type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START,
        });
        addMouseMoveHandlers();

        // createColumnIndicator(columnPosition, columnIndicatorDivRef);
        // repositionColumnIndicator(columnIndicatorDivRef, e);
      };

      // Callback when mouse button is released
      const onMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isCurrentHandleDistributingSpace.current && ref.current) {
          // removeColumnIndicator(columnIndicatorDivRef);
          resetHandleCSS(ref);
          requestAnimationFrame(onCSSTransitionEnd);
          isCurrentHandleDistributingSpace.current = false;
        }
      };

      // Callback triggered when the mouse moves while the handle is distributing space
      const onMouseMove = (e: MouseEvent) => {
        // Ensure the reference to the handle and the distribution flag are valid
        if (ref.current && isCurrentHandleDistributingSpace.current) {
          const dx = e.clientX - x; // Calculate the horizontal change in mouse position from the initial click

          // If there's no horizontal change, no action is needed, so we exit early
          if (dx === 0) return;

          // Convert the horizontal mouse movement (in pixels) to a change in columns based on column width
          const columnChange = dx / columnWidth;

          // Compute the new number of columns for the left and right zones based on the mouse movement
          const leftZoneComputedColumns =
            currentFlexGrow.leftZone + columnChange;
          const rightZoneComputedColumns =
            currentFlexGrow.rightZone - columnChange;

          // Round off the computed column values to whole numbers
          const leftZoneComputedColumnsRoundOff = Math.round(
            leftZoneComputedColumns,
          );
          const rightZoneComputedColumnsRoundOff = Math.round(
            rightZoneComputedColumns,
          );

          // Ensure we have references to the DOM elements representing the left and right zones
          if (leftZoneDom && rightZoneDom) {
            // Check if any of the zones is reaching near to the minimum limit of a zone
            if (
              leftZoneComputedColumns >= minimumShrinkableSpacePerBlock &&
              rightZoneComputedColumns >= minimumShrinkableSpacePerBlock
            ) {
              updatedCSSOfWidgetsOnHandleMove(
                ref,
                leftZoneComputedColumns,
                rightZoneComputedColumns,
                leftZoneDom,
                rightZoneDom,
                minSpacePerBlock,
                currentFlexGrow,
                currentGrowthFactor,
                leftZoneComputedColumnsRoundOff,
                rightZoneComputedColumnsRoundOff,
                columnIndicatorDivRef,
                columnPosition,
                currentMouseSpeed.current,
              );
            } else {
              updatedCSSOfWidgetsOnHittingMinimumLimit(
                leftZoneComputedColumns,
                rightZoneComputedColumns,
                leftZoneDom,
                rightZoneDom,
                minSpacePerBlock,
                currentFlexGrow,
                currentGrowthFactor,
                minimumShrinkableSpacePerBlock,
              );
            }
          }
        }
        // Always reposition the column indicator to follow the mouse, even if no other action is taken
        // repositionColumnIndicator(columnIndicatorDivRef, e);
      };

      // Attach mouse down event listener to the handle
      ref.current.addEventListener("mousedown", onMouseDown);

      // Cleanup: Remove the mouse down event listener when component is unmounted
      return () => {
        if (ref.current) {
          ref.current.removeEventListener("mousedown", onMouseDown);
        }
        if (columnIndicatorDivRef.current) {
          // removeColumnIndicator(columnIndicatorDivRef);
        }
      };
    }
  }, [
    columnPosition,
    minimumShrinkableSpacePerBlock,
    sectionLayoutId,
    spaceDistributed,
    spaceToWorkWith,
  ]);
};
