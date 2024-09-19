import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMouseSpeedTrackingCallback,
  getPropertyPaneZoneId,
  computePropsForSpaceDistribution,
  resetCSSOnZones,
  resetDistributionHandleCSS,
  getPropertyPaneDistributionHandleId,
  convertFlexGrowToFlexBasis,
  convertFlexGrowToFlexBasisForPropPane,
} from "./utils/spaceDistributionEditorUtils";
import { PropPaneDistributionHandleCustomEvent } from "./constants";
import { getSelectedWidgets } from "selectors/ui";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  type SpaceDistributionZoneDomCollection,
  updateWidgetCSSOnHandleMove,
  updateWidgetCSSOnMinimumLimit,
} from "./utils/onMouseMoveUtils";
import {
  startAnvilSpaceDistributionAction,
  stopAnvilSpaceDistributionAction,
  updateSpaceDistributionAction,
} from "./actions";

interface SpaceDistributionEventsProps {
  ref: React.RefObject<HTMLDivElement>;
  spaceDistributed: { [key: string]: number };
  leftZone: string;
  rightZone: string;
  columnPosition: number;
  sectionLayoutId: string;
  sectionWidgetId: string;
  isCurrentHandleDistributingSpace: React.MutableRefObject<boolean>;
  spaceToWorkWith: number;
  zoneIds: string[];
}

export const useSpaceDistributionEvents = ({
  columnPosition,
  isCurrentHandleDistributingSpace,
  leftZone,
  ref,
  rightZone,
  sectionLayoutId,
  sectionWidgetId,
  spaceDistributed,
  spaceToWorkWith,
  zoneIds,
}: SpaceDistributionEventsProps) => {
  const dispatch = useDispatch();
  const columnIndicatorDivRef = useRef<HTMLDivElement>();
  const currentMouseSpeed = useRef(0);
  const mouseSpeedTrackingCallback =
    getMouseSpeedTrackingCallback(currentMouseSpeed);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const { selectWidget } = useWidgetSelection();
  const onSpaceDistributionStart = useCallback(() => {
    dispatch(
      startAnvilSpaceDistributionAction({
        section: sectionWidgetId,
        zones: zoneIds,
      }),
    );
  }, [sectionWidgetId, zoneIds]);
  const selectCorrespondingSectionWidget = useCallback(() => {
    if (!selectedWidgets.includes(sectionWidgetId)) {
      selectWidget(SelectionRequestType.One, [sectionWidgetId]);
    }
  }, [sectionWidgetId, selectedWidgets]);

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
      let columnWidth = 0;
      let minimumShrinkableSpacePerBlock = 0;
      // Retrieve DOM elements for the left and right zones
      const leftZoneDom = document.getElementById(
        getAnvilWidgetDOMId(leftZone),
      );
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );
      let leftZonePropPaneDom: HTMLElement | null = null;
      let rightZonePropPaneDom: HTMLElement | null = null;
      let propPaneHandle: HTMLElement | null = null;

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

        if (propPaneHandle) {
          propPaneHandle.classList.add("active");
        }

        // Update flex-grow values for all distributed zones
        Object.entries(spaceDistributed).forEach(([zoneId, flexGrow]) => {
          const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
          const zonePropDom = document.getElementById(
            getPropertyPaneZoneId(zoneId),
          );

          if (zoneDom) {
            zoneDom.style.flexBasis = convertFlexGrowToFlexBasis(flexGrow);
          }

          if (zonePropDom) {
            zonePropDom.style.flexBasis =
              convertFlexGrowToFlexBasisForPropPane(flexGrow);
          }
        });

        // Add event listeners for mouseup and mousemove events
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mousemove", mouseSpeedTrackingCallback);
      };

      // Remove mouse move event handlers
      const removeMouseMoveHandlers = () => {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mousemove", mouseSpeedTrackingCallback);
      };

      // Callback when CSS transition ends
      const onCSSTransitionEnd = () => {
        // Check if growth factors have changed
        if (
          currentFlexGrow.leftZone !== currentGrowthFactor.leftZone ||
          currentFlexGrow.rightZone !== currentGrowthFactor.rightZone
        ) {
          // Dispatch action to update space distribution
          dispatch(
            updateSpaceDistributionAction(sectionWidgetId, {
              [leftZone]: currentGrowthFactor.leftZone,
              [rightZone]: currentGrowthFactor.rightZone,
            }),
          );
        }

        // Stop space distribution process
        dispatch(stopAnvilSpaceDistributionAction());
        resetCSSOnZones(spaceDistributed);
        removeMouseMoveHandlers();
        currentMouseSpeed.current = 0;
        clearPropPaneDomReferences();

        if (ref.current) {
          ref.current.removeEventListener("transitionend", onCSSTransitionEnd);
        }
      };
      const onPropPaneHandleMouseDown = ((e: CustomEvent) => {
        onMouseDown(e.detail.mouseDownEvent, true);
      }) as EventListener;

      // Callback when mouse button is pressed down
      const onMouseDown = (e: MouseEvent, propHandle = false) => {
        if (!propHandle) {
          const computedProps =
            computePropsForSpaceDistribution(spaceToWorkWith);

          columnWidth = computedProps.columnWidth;
          minimumShrinkableSpacePerBlock =
            computedProps.minimumShrinkableSpacePerBlock;
          selectCorrespondingSectionWidget();
        } else {
          const sectionPreviewBlockDom = document.getElementById(
            "prop-pane-" + sectionWidgetId,
          );

          if (sectionPreviewBlockDom) {
            const computedPropsForHandle = computePropsForSpaceDistribution(
              sectionPreviewBlockDom.offsetWidth,
            );

            columnWidth = computedPropsForHandle.columnWidth;
            minimumShrinkableSpacePerBlock =
              computedPropsForHandle.minimumShrinkableSpacePerBlock;
          }
        }

        e.stopPropagation();
        e.preventDefault();
        x = e.clientX; // Store the initial mouse position
        isCurrentHandleDistributingSpace.current = true; // Set distribution flag
        onSpaceDistributionStart();
        addMouseMoveHandlers();
      };

      // Callback when mouse button is released
      const onMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isCurrentHandleDistributingSpace.current && ref.current) {
          resetDistributionHandleCSS(ref, propPaneHandle);
          requestAnimationFrame(onCSSTransitionEnd);
          isCurrentHandleDistributingSpace.current = false;
        }
      };

      const tryFetchingPropPaneDomReferences = () => {
        // Retrieve DOM elements for the left and right zones on the property pane
        // Why are we fetching these references here?
        // Because the property pane is rendered after space distribution is started when no corresponding zone/section is selected before
        // start of space distribution.
        // Check SpaceDistributionHandle component's useEffect for more details.
        leftZonePropPaneDom = document.getElementById(
          getPropertyPaneZoneId(leftZone),
        );
        rightZonePropPaneDom = document.getElementById(
          getPropertyPaneZoneId(rightZone),
        );
        propPaneHandle = document.getElementById(
          getPropertyPaneDistributionHandleId(leftZone),
        );

        if (propPaneHandle) {
          propPaneHandle.classList.add("active");
        }
      };

      const clearPropPaneDomReferences = () => {
        leftZonePropPaneDom = null;
        rightZonePropPaneDom = null;
        propPaneHandle = null;
      };

      // Callback triggered when the mouse moves while the handle is distributing space
      const onMouseMove = (e: MouseEvent) => {
        if (!(leftZonePropPaneDom && rightZonePropPaneDom)) {
          tryFetchingPropPaneDomReferences();
        }

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
            const zoneDomCollection: SpaceDistributionZoneDomCollection = {
              leftZoneDom,
              rightZoneDom,
              leftZonePropPaneDom,
              rightZonePropPaneDom,
            };

            // Check if any of the zones is reaching near to the minimum limit of a zone
            if (
              leftZoneComputedColumns >= minimumShrinkableSpacePerBlock &&
              rightZoneComputedColumns >= minimumShrinkableSpacePerBlock
            ) {
              updateWidgetCSSOnHandleMove(
                leftZoneComputedColumns,
                rightZoneComputedColumns,
                zoneDomCollection,
                currentFlexGrow,
                currentGrowthFactor,
                leftZoneComputedColumnsRoundOff,
                rightZoneComputedColumnsRoundOff,
                columnIndicatorDivRef,
                columnPosition,
                currentMouseSpeed.current,
              );
            } else {
              updateWidgetCSSOnMinimumLimit(
                leftZoneComputedColumns,
                rightZoneComputedColumns,
                zoneDomCollection,
                currentFlexGrow,
                currentGrowthFactor,
                minimumShrinkableSpacePerBlock,
              );
            }
          }
        }
      };

      // Attach mouse down event listener to the handle
      ref.current.addEventListener("mousedown", onMouseDown);
      ref.current.addEventListener(
        PropPaneDistributionHandleCustomEvent,
        onPropPaneHandleMouseDown,
      );

      // Cleanup: Remove the mouse down event listener when component is unmounted
      return () => {
        if (ref.current) {
          ref.current.removeEventListener("mousedown", onMouseDown);
          ref.current.removeEventListener(
            PropPaneDistributionHandleCustomEvent,
            onPropPaneHandleMouseDown,
          );
        }
      };
    }
  }, [
    columnPosition,
    selectCorrespondingSectionWidget,
    sectionLayoutId,
    sectionWidgetId,
    spaceDistributed,
    spaceToWorkWith,
    onSpaceDistributionStart,
  ]);
};
