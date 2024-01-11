import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import type { WidgetLayoutProps } from "../utils/anvilTypes";
import { getWidgetByID } from "sagas/selectors";
import { getDefaultSpaceDistributed } from "./spaceRedistributionUtils";
import { SpaceDistributionHandle } from "./SpaceDistributionHandle";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";

interface SectionSpaceDistributorProps {
  sectionWidgetId: string;
  sectionLayoutId: string;
  zones: WidgetLayoutProps[];
}

export interface SectionSpaceDistributorHandlesProps
  extends SectionSpaceDistributorProps {}

const convertPixelValuesToNumber = (value: string) => {
  return parseFloat(value.replace("px", ""));
};

const getElementsBoundingBoxValue = (ele: HTMLElement) => {
  const computedStyle = getComputedStyle(ele);
  const paddingValue = convertPixelValuesToNumber(computedStyle.padding);
  const borderValue = convertPixelValuesToNumber(computedStyle.border);
  const marginValue = convertPixelValuesToNumber(computedStyle.margin);
  return 2 * (paddingValue + borderValue + marginValue);
};

const getAnvilZoneOffset = (zoneId: string) => {
  const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
  if (zoneDom) {
    return getElementsBoundingBoxValue(zoneDom) + 2;
  }
  return 0;
};

const SectionSpaceDistributorHandles = (
  props: SectionSpaceDistributorHandlesProps,
) => {
  // Get layout element positions and section widget
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const sectionWidget = useSelector(getWidgetByID(props.sectionWidgetId));

  // Get the default space distribution for the specified zones
  const defaultSpaceDistributed = getDefaultSpaceDistributed(
    props.zones.map((each) => each.widgetId),
  );

  // Destructure spaceDistributed property from sectionWidget or use default
  const { spaceDistributed = defaultSpaceDistributed } = sectionWidget;
  const zoneOffset = getAnvilZoneOffset(props.zones[0].widgetId);
  // Initialize variables for tracking zone positions and space to work with
  let previousZonePosition: LayoutElementPosition;
  let previousZoneColumn = 0;
  let spaceToWorkWith = -(zoneOffset * props.zones.length);

  // Generate an array of space distribution nodes based on the zones
  const SectionSpaceDistributorNodes = props.zones.reduce(
    (nodesArray, each, index) => {
      const widgetPosition = layoutElementPositions[each.widgetId];
      spaceToWorkWith = spaceToWorkWith + widgetPosition.width;

      if (index === 0) {
        // Skip the first iteration
        previousZoneColumn += spaceDistributed[each.widgetId];
        previousZonePosition = widgetPosition;
        return nodesArray;
      }

      if (widgetPosition && previousZonePosition) {
        // Calculate space between zones and create a distribution node
        const spaceBetweenZones =
          widgetPosition.offsetLeft -
          (previousZonePosition.offsetLeft + previousZonePosition.width);

        nodesArray.push({
          parentZones: [props.zones[index - 1].widgetId, each.widgetId],
          spaceBetweenZones,
          columnPosition: previousZoneColumn,
          position: {
            left: widgetPosition.offsetLeft - spaceBetweenZones * 0.5,
          },
        });

        // Update variables for the next iteration
        previousZoneColumn += spaceDistributed[each.widgetId];
        previousZonePosition = widgetPosition;
      }

      return nodesArray;
    },
    [] as {
      position: {
        left: number;
      };
      parentZones: string[];
      spaceBetweenZones: number;
      columnPosition: number;
    }[],
  );

  return (
    <>
      {SectionSpaceDistributorNodes.map((each, index) => (
        <SpaceDistributionHandle
          columnPosition={each.columnPosition}
          key={index}
          left={each.position.left}
          parentZones={each.parentZones}
          sectionLayoutId={props.sectionLayoutId}
          spaceDistributed={spaceDistributed}
          spaceToWorkWith={spaceToWorkWith}
        />
      ))}
    </>
  );
};

export const SectionSpaceDistributor = (
  props: SectionSpaceDistributorProps,
) => {
  const { zones } = props;
  const isPreviewMode = useSelector(previewModeSelector);
  const isDragging = useSelector(
    (state) => state.ui.widgetDragResize.isDragging,
  );
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const allZonePositionsAreAvailable = zones.every(
    (each) => !!layoutElementPositions[each.widgetId],
  );
  const canRedistributeSpace =
    !isPreviewMode &&
    !isDragging &&
    allZonePositionsAreAvailable &&
    zones.length > 1;
  return canRedistributeSpace ? (
    <SectionSpaceDistributorHandles {...props} />
  ) : null;
};
