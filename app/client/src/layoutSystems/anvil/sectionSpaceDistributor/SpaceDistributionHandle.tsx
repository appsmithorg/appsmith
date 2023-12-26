import type { LayoutElementPositions } from "layoutSystems/common/types";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { AnvilReduxActionTypes } from "../integrations/actions/actionTypes";
import { SpaceDistributorHandleDimensions } from "./constants";
import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";
import { getAnvilSpaceDistributionStatus } from "../integrations/selectors";

interface SpaceDistributionNodeProps {
  columnPosition: number;
  left: number;
  parentZones: string[];
  sectionLayoutId: string;
  layoutElementPositions: LayoutElementPositions;
  spaceToWorkWith: number;
  spaceBetweenZones: number;
  spaceDistributed: { [key: string]: number };
}
const StyledSpaceDistributionHandle = styled.div<{ left: number }>`
  display: inline;
  position: absolute;
  width: ${SpaceDistributorHandleDimensions.width}px;
  height: calc(100% - ${2 * SpaceDistributorHandleDimensions.offsetTop}px);
  top: ${SpaceDistributorHandleDimensions.offsetTop}px;
  border-radius: ${SpaceDistributorHandleDimensions.borderRadius}px;
  padding: 0px ${SpaceDistributorHandleDimensions.padding}px;
  border: ${SpaceDistributorHandleDimensions.border}px solid;
  border-color: white;
  background: #f86a2b;
  opacity: 0%;
  z-index: 1000;
  left: ${({ left }) => left}px;
  &:hover,
  &.active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

const updateHandlePosition = (
  entries: ResizeObserverEntry[],
  ref: React.RefObject<HTMLDivElement>,
) => {
  if (ref.current && entries.length) {
    const target = entries[0].target as HTMLElement;
    const updatedLeft =
      target.offsetLeft - SpaceDistributorHandleDimensions.width * 0.5;
    ref.current.style.left = updatedLeft + "px";
  }
};

export const SpaceDistributionHandle = ({
  columnPosition,
  layoutElementPositions,
  left,
  parentZones,
  sectionLayoutId,
  spaceBetweenZones,
  spaceDistributed,
  spaceToWorkWith,
}: SpaceDistributionNodeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const shrinkablePixels = 10;
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const isCurrentHandleDistributingSpace = useRef(false);
  const leftPositionOfHandle =
    left - SpaceDistributorHandleDimensions.width * 0.5;
  const [leftZone, rightZone] = parentZones;
  const columnWidth = spaceToWorkWith / SectionColumns;
  const minSpacePerBlock = ZoneMinColumnWidth;
  const minLimitBounceBackThreshold = shrinkablePixels / columnWidth;
  const minimumShrinkableSpacePerBlock =
    minSpacePerBlock - minLimitBounceBackThreshold;
  const columnIndicatorDivRef = useRef<HTMLDivElement>();
  const resizeObserverRef = useRef<ResizeObserver>();
  resizeObserverRef.current = new ResizeObserver((entries) => {
    updateHandlePosition(entries, ref);
  });
  useEffect(() => {
    if (ref.current) {
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );
      if (isDistributingSpace) {
        if (!isCurrentHandleDistributingSpace.current) {
          ref.current.style.display = "none";
        }
        rightZoneDom && resizeObserverRef.current?.observe(rightZoneDom);
      } else {
        ref.current.style.display = "block";
        rightZoneDom && resizeObserverRef.current?.unobserve(rightZoneDom);
      }
    }
  }, [isDistributingSpace]);
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
      };

      // Reset CSS styles for the handle when not in use
      const resetHandleCSS = () => {
        if (ref.current) {
          ref.current.style.transition = "";
          ref.current.classList.remove("active");
          ref.current.style.left = "";
          ref.current.style.display = "none";
        }
      };

      // Reset CSS styles for all zones
      const resetCSSOnZones = () => {
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

      // Remove mouse move event handlers
      const removeMouseMoveHandlers = () => {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousemove", onMouseMove);
      };

      // Create a visual column indicator
      const createColumnIndicator = () => {
        const columnIndicatorDiv = document.createElement("div");
        // Display the current column position and total columns
        columnIndicatorDiv.innerHTML = `${columnPosition} / ${SectionColumns}`;
        columnIndicatorDiv.style.position = "absolute";
        // Styling for the indicator
        columnIndicatorDiv.style.background = "white";
        columnIndicatorDiv.style.color = "black";
        columnIndicatorDiv.style.padding = "2px";
        columnIndicatorDiv.style.borderRadius = "2px";
        columnIndicatorDiv.style.boxShadow = "0px 0px 2px 2px black";
        columnIndicatorDiv.style.zIndex = "1000";
        columnIndicatorDiv.style.fontSize = "10px";
        columnIndicatorDiv.style.fontWeight = "bold";
        document.body.appendChild(columnIndicatorDiv);
        columnIndicatorDivRef.current = columnIndicatorDiv;
      };

      // Remove the visual column indicator
      const removeColumnIndicator = () => {
        if (columnIndicatorDivRef.current) {
          columnIndicatorDivRef.current.remove();
          columnIndicatorDivRef.current = undefined;
        }
      };

      // Reposition the column indicator based on mouse movement
      const repositionColumnIndicator = (e: MouseEvent) => {
        if (columnIndicatorDivRef.current) {
          columnIndicatorDivRef.current.style.left =
            e.clientX + shrinkablePixels + "px";
          columnIndicatorDivRef.current.style.top =
            e.clientY - shrinkablePixels + "px";
        }
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
        resetCSSOnZones();
        removeMouseMoveHandlers();
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
        createColumnIndicator();
        repositionColumnIndicator(e);
      };

      // Callback when mouse button is released
      const onMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isCurrentHandleDistributingSpace.current && ref.current) {
          removeColumnIndicator();
          resetHandleCSS();
          requestAnimationFrame(onCSSTransitionEnd);
          isCurrentHandleDistributingSpace.current = false;
        }
      };

      // Check if resistive force is needed for the zones
      const checkForNeedToAddResistiveForce = (
        leftZoneComputedColumns: number,
        rightZoneComputedColumns: number,
        leftZoneDom: HTMLElement,
        rightZoneDom: HTMLElement,
      ) => {
        if (ref.current) {
          // Check if the zones are below the minimum space
          const isLeftZoneLessThanMinimum =
            leftZoneComputedColumns <= minSpacePerBlock;
          const isRightZoneLessThanMinimum =
            rightZoneComputedColumns <= minSpacePerBlock;

          // Apply transition if zones are below the minimum space, else remove transition
          if (isLeftZoneLessThanMinimum) {
            leftZoneDom.style.transition = "all 0.6s ease";
          } else {
            leftZoneDom.style.transition = "";
          }
          if (isRightZoneLessThanMinimum) {
            rightZoneDom.style.transition = "all 0.6s ease";
          } else {
            rightZoneDom.style.transition = "";
          }
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
              checkForNeedToAddResistiveForce(
                leftZoneComputedColumns,
                rightZoneComputedColumns,
                leftZoneDom,
                rightZoneDom,
              );
              // adjust the zones flex grow property to the minimum shrinkable space
              leftZoneDom.style.flexGrow = Math.max(
                leftZoneComputedColumns,
                minimumShrinkableSpacePerBlock,
              ).toString();
              rightZoneDom.style.flexGrow = Math.max(
                rightZoneComputedColumns,
                minimumShrinkableSpacePerBlock,
              ).toString();
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
            } else {
              const totalSpace =
                currentFlexGrow.leftZone + currentFlexGrow.rightZone;
              const spaceForTheZoneOtherThanShrunkenZone =
                totalSpace - minSpacePerBlock;
              // If one or both zones don't have enough space, set them to the minimum shrinkable space
              if (leftZoneComputedColumns < minimumShrinkableSpacePerBlock) {
                leftZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
                rightZoneDom.style.flexGrow = (
                  totalSpace - minimumShrinkableSpacePerBlock
                ).toString();
                currentGrowthFactor.leftZone = minSpacePerBlock;
                currentGrowthFactor.rightZone =
                  spaceForTheZoneOtherThanShrunkenZone;
              } else if (
                rightZoneComputedColumns < minimumShrinkableSpacePerBlock
              ) {
                rightZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
                leftZoneDom.style.flexGrow = (
                  totalSpace - minimumShrinkableSpacePerBlock
                ).toString();
                currentGrowthFactor.leftZone =
                  spaceForTheZoneOtherThanShrunkenZone;
                currentGrowthFactor.rightZone = minSpacePerBlock;
              }
            }
          }
        }
        // Always reposition the column indicator to follow the mouse, even if no other action is taken
        repositionColumnIndicator(e);
      };

      // Attach mouse down event listener to the handle
      ref.current.addEventListener("mousedown", onMouseDown);

      // Cleanup: Remove the mouse down event listener when component is unmounted
      return () => {
        if (ref.current) {
          ref.current.removeEventListener("mousedown", onMouseDown);
        }
      };
    }
  }, [
    columnPosition,
    minimumShrinkableSpacePerBlock,
    layoutElementPositions,
    left,
    parentZones,
    sectionLayoutId,
    spaceBetweenZones,
    spaceDistributed,
    spaceToWorkWith,
  ]);

  return (
    <StyledSpaceDistributionHandle left={leftPositionOfHandle} ref={ref} />
  );
};
