import type { AppState } from "@appsmith/reducers";
import { getLayoutElementPositions } from "layoutSystems/common/selectors";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import type { WidgetLayoutProps } from "../utils/anvilTypes";
import { SpaceDistributionHandle } from "./SpaceDistributionHandle";

interface SectionSpaceDistributorProps {
  sectionId: string;
  zones: WidgetLayoutProps[];
}

export interface SectionSpaceDistributorHandlesProps
  extends SectionSpaceDistributorProps {}

const SectionSpaceDistributorHandles = (
  props: SectionSpaceDistributorHandlesProps,
) => {
  const layoutElementPositions = useSelector(getLayoutElementPositions);
  const { zones } = props;
  const isDistributingSpace = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDistributingSpace,
  );
  useEffect(() => {
    if (isDistributingSpace) {
      zones.forEach((each) => {
        const zoneDom = document.getElementById(
          getAnvilWidgetDOMId(each.widgetId),
        );
        const zonePosition = layoutElementPositions[each.widgetId];
        if (zoneDom && zonePosition) {
          // zoneDom.style.flexGrow = `${12 / zones.length}`;
          zoneDom.style.flex = `1 1 ${100 / zones.length}%`;
        }
      });
    }
  }, [isDistributingSpace]);
  const SectionSpaceDistributorNodes: {
    position: {
      left: number;
    };
    parentZones: string[];
  }[] = [];
  let previousZonePosition: LayoutElementPosition;
  let spaceToWorkWith = 0;
  zones.forEach((each, index) => {
    const widgetPosition = layoutElementPositions[each.widgetId];
    spaceToWorkWith = spaceToWorkWith + widgetPosition.width;
    if (index === 0) {
      previousZonePosition = widgetPosition;
      return;
    }
    if (widgetPosition && previousZonePosition) {
      const spaceBetweenZones =
        widgetPosition.offsetLeft -
        (previousZonePosition.offsetLeft + previousZonePosition.width);
      SectionSpaceDistributorNodes.push({
        parentZones: [zones[index - 1].widgetId, each.widgetId],
        position: {
          left: widgetPosition.offsetLeft - spaceBetweenZones * 0.5,
        },
      });
      previousZonePosition = widgetPosition;
    }
  });
  return (
    <>
      {SectionSpaceDistributorNodes.map((each, index) => {
        return (
          <SpaceDistributionHandle
            index={index}
            key={index}
            left={each.position.left}
            parentZones={each.parentZones}
            sectionId={props.sectionId}
            spaceToWorkWith={spaceToWorkWith}
            layoutElementPositions={layoutElementPositions}
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
