import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import type { WidgetLayoutProps } from "../utils/anvilTypes";
import { getWidgetByID } from "sagas/selectors";
import { getDefaultSpaceDistributed } from "./utils/spaceRedistributionSagaUtils";
import { SpaceDistributionHandle } from "./SpaceDistributionHandle";
import { getAnvilZoneBoundaryOffset } from "./utils/spaceDistributionEditorUtils";
import { getWidgetSelectionBlock } from "selectors/ui";

interface SectionSpaceDistributorProps {
  sectionWidgetId: string;
  sectionLayoutId: string;
  zones: WidgetLayoutProps[];
}

export interface SectionSpaceDistributorHandlesProps
  extends SectionSpaceDistributorProps {}

const SectionSpaceDistributorHandles = (
  props: SectionSpaceDistributorHandlesProps,
) => {
  const { sectionLayoutId, sectionWidgetId, zones } = props;
  // Get layout element positions and section widget
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const sectionWidget = useSelector(getWidgetByID(sectionWidgetId));
  const zoneIds = useMemo(() => {
    return zones.map((each) => each.widgetId);
  }, [zones]);
  // Get the default space distribution for the specified zones
  const defaultSpaceDistributed = getDefaultSpaceDistributed(zoneIds);

  // Destructure spaceDistributed property from sectionWidget or use default
  const { spaceDistributed = defaultSpaceDistributed } = sectionWidget;
  // Get the zone boundary offset(margin + padding + border) for the any one zone in the section.(because all zones have same offset)
  const zoneOffset = getAnvilZoneBoundaryOffset(zones[0].widgetId);
  // Initialize variables for tracking zone positions and space to work with
  let previousZonePosition: LayoutElementPosition;
  let previousZoneColumn = 0;
  let spaceToWorkWith = -(zoneOffset * zones.length);
  // Generate an array of space distribution nodes based on the zones
  const SectionSpaceDistributorNodes = zones.reduce(
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
        const zoneGap =
          widgetPosition.offsetLeft -
          (previousZonePosition.offsetLeft + previousZonePosition.width);

        nodesArray.push({
          parentZones: [zones[index - 1].widgetId, each.widgetId],
          columnPosition: previousZoneColumn,
          position: {
            left: widgetPosition.offsetLeft,
          },
          zoneGap,
        });

        // Update zone column position and previous zone position
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
      columnPosition: number;
      zoneGap: number;
    }[],
  );

  return (
    <>
      {SectionSpaceDistributorNodes.map(
        ({ columnPosition, parentZones, position, zoneGap }, index) => (
          <SpaceDistributionHandle
            columnPosition={columnPosition}
            key={index}
            left={position.left}
            parentZones={parentZones}
            sectionLayoutId={sectionLayoutId}
            sectionWidgetId={sectionWidgetId}
            spaceDistributed={spaceDistributed}
            spaceToWorkWith={spaceToWorkWith}
            zoneGap={zoneGap}
            zoneIds={zoneIds}
          />
        ),
      )}
    </>
  );
};

export const SectionSpaceDistributor = (
  props: SectionSpaceDistributorProps,
) => {
  const { zones } = props;
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isWidgetSelectionBlocked = useSelector(getWidgetSelectionBlock);
  const isDragging = useSelector(
    (state) => state.ui.widgetDragResize.isDragging,
  );
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  // Check if all zone positions are available
  const allZonePositionsAreAvailable = zones.every(
    (each) => !!layoutElementPositions[each.widgetId],
  );
  // Check if space can be redistributed
  const canRedistributeSpace =
    !isPreviewMode &&
    !isDragging &&
    !isWidgetSelectionBlocked &&
    allZonePositionsAreAvailable &&
    zones.length > 1;

  return canRedistributeSpace ? (
    <SectionSpaceDistributorHandles {...props} />
  ) : null;
};
