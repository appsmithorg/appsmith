import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import type { WidgetLayoutProps } from "../utils/anvilTypes";
import { SpaceDistributionHandle } from "./SpaceDistributionHandle";
import { SectionColumns } from "../utils/constants";
import { getWidgetByID } from "sagas/selectors";

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
  const defaultSpaceDistributed = zones.reduce(
    (distributedSpace, each) => {
      distributedSpace[each.widgetId] = SectionColumns / zones.length;
      return distributedSpace;
    },
    {} as { [key: string]: number },
  );
  const { spaceDistributed = defaultSpaceDistributed } = sectionWidget;
  let previousZonePosition: LayoutElementPosition;
  let spaceToWorkWith = 0;
  const SectionSpaceDistributorNodes = zones.reduce(
    (nodesArray, each, index) => {
      const widgetPosition = layoutElementPositions[each.widgetId];
      spaceToWorkWith = spaceToWorkWith + widgetPosition.width;
      if (index === 0) {
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
          position: {
            left: widgetPosition.offsetLeft - spaceBetweenZones * 0.5,
          },
        });
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
    }[],
  );
  return (
    <>
      {SectionSpaceDistributorNodes.map((each, index) => {
        return (
          <SpaceDistributionHandle
            index={index}
            key={index}
            layoutElementPositions={layoutElementPositions}
            left={each.position.left}
            parentZones={each.parentZones}
            sectionLayoutId={props.sectionLayoutId}
            spaceBetweenZones={each.spaceBetweenZones}
            spaceDistributed={spaceDistributed}
            spaceToWorkWith={spaceToWorkWith}
            zoneCount={zones.length}
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
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const allZonePositionsAreAvailable = zones.every(
    (each) => !!layoutElementPositions[each.widgetId],
  );
  const canRedistributeSpace =
    !isPreviewMode && allZonePositionsAreAvailable && zones.length > 1;
  return canRedistributeSpace ? (
    <SectionSpaceDistributorHandles {...props} />
  ) : null;
};
