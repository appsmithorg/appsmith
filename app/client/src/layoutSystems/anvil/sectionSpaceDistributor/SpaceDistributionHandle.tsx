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
  height: ${SpaceDistributorHandleDimensions.height}%;
  border-radius: ${SpaceDistributorHandleDimensions.height * 0.5}px;
  padding: 0px ${SpaceDistributorHandleDimensions.padding}px;
  border: ${SpaceDistributorHandleDimensions.border}px solid;
  border-color: white;
  background: #f86a2b;
  opacity: 0%;
  z-index: 1000;
  top: calc(50% - ${SpaceDistributorHandleDimensions.height * 0.5}%);
  left: ${({ left }) => left}px;
  &:hover,
  &.active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

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
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const isCurrentHandleDistributingSpace = useRef(false);
  const leftPositionOfHandle =
    left - SpaceDistributorHandleDimensions.width * 0.5;
  const [leftZone, rightZone] = parentZones;
  const columnWidth = spaceToWorkWith / SectionColumns;
  const minSpacePerBlock = ZoneMinColumnWidth;
  const minLimitBounceBackThreshold = 10 / columnWidth;
  const minimumShrinkableSpacePerBlock =
    minSpacePerBlock - minLimitBounceBackThreshold;
  const columnIndicatorDivRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (ref.current) {
      if (isDistributingSpace) {
        if (!isCurrentHandleDistributingSpace.current) {
          ref.current.style.display = "none";
        }
      } else {
        ref.current.style.display = "block";
      }
    }
  }, [isDistributingSpace]);
  useEffect(() => {
    if (ref.current) {
      // The current position of mouse
      let x = 0;
      let lastValidHandlePosition = 0;
      const currentFlexGrow = {
        leftZone: spaceDistributed[leftZone],
        rightZone: spaceDistributed[rightZone],
      };
      const leftZoneDom = document.getElementById(
        getAnvilWidgetDOMId(leftZone),
      );
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );
      const currentGrowthFactor = {
        leftZone: currentFlexGrow.leftZone,
        rightZone: currentFlexGrow.rightZone,
      };
      const sectionLayoutDom = ref.current.parentElement;
      const addMouseMoveHandlers = () => {
        if (ref.current && sectionLayoutDom) {
          ref.current.classList.add("active");
        }
        Object.entries(spaceDistributed).forEach(([zoneId, flexGrow]) => {
          const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
          if (zoneDom) {
            zoneDom.style.flexGrow = flexGrow.toString();
          }
        });
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
      };
      const resetHandleCSS = () => {
        if (ref.current) {
          ref.current.style.transition = "";
          ref.current.classList.remove("active");
          ref.current.style.left = "";
          ref.current.style.display = "none";
        }
      };
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
      const removeMouseMoveHandlers = () => {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousemove", onMouseMove);
      };

      const createColumnIndicator = () => {
        const columnIndicatorDiv = document.createElement("div");
        columnIndicatorDiv.innerHTML = `${columnPosition} / ${SectionColumns}`;
        columnIndicatorDiv.style.position = "absolute";
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
      const removeColumnIndicator = () => {
        if (columnIndicatorDivRef.current) {
          columnIndicatorDivRef.current.remove();
          columnIndicatorDivRef.current = undefined;
        }
      };
      const repositionColumnIndicator = (e: MouseEvent) => {
        if (columnIndicatorDivRef.current) {
          columnIndicatorDivRef.current.style.left = e.clientX + 10 + "px";
          columnIndicatorDivRef.current.style.top = e.clientY - 10 + "px";
        }
      };
      const onCSSTransitionEnd = () => {
        if (
          currentFlexGrow.leftZone !== currentGrowthFactor.leftZone ||
          currentFlexGrow.rightZone !== currentGrowthFactor.rightZone
        ) {
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
        dispatch({
          type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP,
        });
        resetCSSOnZones();
        removeMouseMoveHandlers();
        if (ref.current) {
          ref.current.removeEventListener("transitionend", onCSSTransitionEnd);
        }
      };
      const onMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Get the current mouse position
        x = e.clientX;
        isCurrentHandleDistributingSpace.current = true;
        dispatch({
          type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START,
        });
        addMouseMoveHandlers();
        createColumnIndicator();
        repositionColumnIndicator(e);
      };
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
      const checkForNeedToAddResistiveForce = (
        leftZoneComputedColumns: number,
        rightZoneComputedColumns: number,
        leftZoneDom: HTMLElement,
        rightZoneDom: HTMLElement,
      ) => {
        if (ref.current) {
          if (leftZoneComputedColumns <= minSpacePerBlock) {
            leftZoneDom.style.transition = "all 0.6s ease";
            // ref.current.style.transition = "all 0.6s ease";
          } else {
            leftZoneDom.style.transition = "";
            ref.current.style.transition = "";
          }
          if (rightZoneComputedColumns <= minSpacePerBlock) {
            rightZoneDom.style.transition = "all 0.6s ease";
            // ref.current.style.transition = "all 0.6s ease";
          } else {
            rightZoneDom.style.transition = "";
            ref.current.style.transition = "";
          }
        }
      };
      const onMouseMove = (e: MouseEvent) => {
        if (ref.current && isCurrentHandleDistributingSpace.current) {
          const dx = e.clientX - x;
          if (dx === 0) return; // Prevents unnecessary re-renders
          const columnChange = dx / columnWidth;
          const leftZoneComputedColumns =
            currentFlexGrow.leftZone + columnChange;
          const rightZoneComputedColumns =
            currentFlexGrow.rightZone - columnChange;
          const leftZoneComputedColumnsRoundOff = Math.round(
            leftZoneComputedColumns,
          );
          const rightZoneComputedColumnsRoundOff = Math.round(
            rightZoneComputedColumns,
          );
          if (leftZoneDom && rightZoneDom) {
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
              leftZoneDom.style.background = "";
              rightZoneDom.style.background = "";
              leftZoneDom.style.flexGrow = Math.max(
                leftZoneComputedColumns,
                minSpacePerBlock,
              ).toString();
              rightZoneDom.style.flexGrow = Math.max(
                rightZoneComputedColumns,
                minSpacePerBlock,
              ).toString();
              const spaceBetweenZones =
                rightZoneDom.offsetLeft -
                (leftZoneDom.offsetLeft + leftZoneDom.clientWidth);
              const updatedLeft =
                rightZoneDom.offsetLeft -
                spaceBetweenZones * 0.5 -
                SpaceDistributorHandleDimensions.width * 0.5;
              lastValidHandlePosition = updatedLeft;
              ref.current.style.left = updatedLeft + "px";
              currentGrowthFactor.leftZone = leftZoneComputedColumnsRoundOff;
              currentGrowthFactor.rightZone = rightZoneComputedColumnsRoundOff;
              if (columnIndicatorDivRef.current) {
                columnIndicatorDivRef.current.innerHTML = `${
                  columnPosition -
                  currentFlexGrow.leftZone +
                  leftZoneComputedColumnsRoundOff
                } / ${SectionColumns}`;
              }
            } else {
              if (leftZoneComputedColumns < minimumShrinkableSpacePerBlock) {
                leftZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
                rightZoneDom.style.flexGrow = (
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  minSpacePerBlock
                ).toString();
                const spaceBetweenZones =
                  rightZoneDom.offsetLeft -
                  (leftZoneDom.offsetLeft + leftZoneDom.clientWidth);
                const updatedLeft =
                  rightZoneDom.offsetLeft -
                  spaceBetweenZones * 0.5 -
                  SpaceDistributorHandleDimensions.width * 0.5;
                lastValidHandlePosition = updatedLeft;
                ref.current.style.left = updatedLeft + "px";
                currentGrowthFactor.leftZone = minSpacePerBlock;
                currentGrowthFactor.rightZone =
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  minSpacePerBlock;
              } else if (
                rightZoneComputedColumns < minimumShrinkableSpacePerBlock
              ) {
                rightZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
                leftZoneDom.style.flexGrow = (
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  minSpacePerBlock
                ).toString();
                const spaceBetweenZones =
                  rightZoneDom.offsetLeft -
                  (leftZoneDom.offsetLeft + leftZoneDom.clientWidth);
                const updatedLeft =
                  rightZoneDom.offsetLeft -
                  spaceBetweenZones * 0.5 -
                  SpaceDistributorHandleDimensions.width * 0.5;
                lastValidHandlePosition = updatedLeft;
                ref.current.style.left = updatedLeft + "px";
                currentGrowthFactor.leftZone =
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  minSpacePerBlock;
                currentGrowthFactor.rightZone = minSpacePerBlock;
              }
              ref.current.style.left = lastValidHandlePosition + "px";
            }
          }
        }
        repositionColumnIndicator(e);
      };
      ref.current.addEventListener("mousedown", onMouseDown);

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
