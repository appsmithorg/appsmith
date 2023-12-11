import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import type { WidgetLayoutProps } from "../utils/anvilTypes";
import { SpaceDistributionHandle } from "./SpaceDistributionHandle";
import { getWidgetByID } from "sagas/selectors";
import { getDefaultSpaceDistributed } from "./spaceRedistributionUtils";

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
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const { zones } = props;
  const sectionWidget = useSelector(getWidgetByID(props.sectionWidgetId));
  const defaultSpaceDistributed = getDefaultSpaceDistributed(
    zones.map((each) => each.widgetId),
  );
  const { spaceDistributed = defaultSpaceDistributed } = sectionWidget;
  let previousZonePosition: LayoutElementPosition;
  let previousZoneColumn = 0;
  let spaceToWorkWith = 0;
  const SectionSpaceDistributorNodes = zones.reduce(
    (nodesArray, each, index) => {
      const widgetPosition = layoutElementPositions[each.widgetId];
      spaceToWorkWith = spaceToWorkWith + widgetPosition.width;
      if (index === 0) {
        previousZoneColumn += spaceDistributed[each.widgetId];
        previousZonePosition = widgetPosition;
        return nodesArray;
      }
      if (widgetPosition && previousZonePosition) {
        const spaceBetweenZones =
          widgetPosition.offsetLeft -
          (previousZonePosition.offsetLeft + previousZonePosition.width);
        nodesArray.push({
          parentZones: [zones[index - 1].widgetId, each.widgetId],
          spaceBetweenZones,
          columnPosition: previousZoneColumn,
          position: {
            left: widgetPosition.offsetLeft - spaceBetweenZones * 0.5,
          },
        });
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
      {SectionSpaceDistributorNodes.map((each, index) => {
        return (
          <SpaceDistributionHandle
            columnPosition={each.columnPosition}
            key={index}
            layoutElementPositions={layoutElementPositions}
            left={each.position.left}
            parentZones={each.parentZones}
            sectionLayoutId={props.sectionLayoutId}
            spaceBetweenZones={each.spaceBetweenZones}
            spaceDistributed={spaceDistributed}
            spaceToWorkWith={spaceToWorkWith}
          />
        );
      })}
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
