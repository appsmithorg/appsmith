import React from "react";
import styled from "styled-components";
import {
  convertFlexGrowToFlexBasisForPropPane,
  getDistributionHandleId,
  getPropertyPaneDistributionHandleId,
  getPropertyPaneZoneId,
} from "../utils/spaceDistributionEditorUtils";
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { getParentWidget } from "selectors/widgetSelectors";
import type { AppState } from "ee/reducers";
import type { WidgetLayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { PropertyPaneSpaceDistributionHandle } from "./PropertyPaneSpaceDistributionHandle";

const MockedSection = styled.div`
  background-color: var(--ads-v2-color-bg-emphasis);
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  height: 34px;
  justify-content: flex-start;
  border: 2px solid var(--ads-v2-color-bg-emphasis);
`;

const MockedZone = styled.div<{ flexBasis: string }>`
  display: flex;
  border-radius: 3px;
  background-color: var(--ads-v2-color-bg);
  flex-shrink: 1;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  flex-basis: ${(props) => props.flexBasis};
`;

export const PropertyPaneSectionSpaceDistributor = ({
  sectionWidgetId,
}: {
  sectionWidgetId: string;
}) => {
  // Get section widget data from Redux store
  const sectionWidget = useSelector(getWidgetByID(sectionWidgetId));

  // Extract all zone IDs in order from the section widget layout
  const allZoneIdsInOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );

  // Get the current distributed space from the section widget
  const currentDistributedSpace = sectionWidget.spaceDistributed;

  // Check if the section widget is not available or has no zones
  if (!sectionWidget || allZoneIdsInOrder.length === 0) {
    return null;
  }

  return (
    <MockedSection id={"prop-pane-" + sectionWidgetId}>
      {allZoneIdsInOrder.map((zoneId: string, index: number) => {
        const zoneValue = currentDistributedSpace[zoneId];
        const zoneLabel =
          zoneValue + (allZoneIdsInOrder.length === 1 ? " columns" : "");
        const isNotLastZone = allZoneIdsInOrder.length - 1 !== index;
        const distributionHandleId = getDistributionHandleId(zoneId);
        const propPaneZoneId = getPropertyPaneZoneId(zoneId);
        const propPaneHandleId = getPropertyPaneDistributionHandleId(zoneId);
        const flexBasisValue = convertFlexGrowToFlexBasisForPropPane(zoneValue);

        return (
          // Render mocked zone and distribution handle for each zone
          <>
            <MockedZone
              data-testid={"t--anvil-zone-distribution-value"}
              flexBasis={flexBasisValue}
              id={propPaneZoneId}
              key={propPaneZoneId}
            >
              {zoneLabel}
            </MockedZone>
            {isNotLastZone ? (
              <PropertyPaneSpaceDistributionHandle
                distributionHandleId={distributionHandleId}
                propPaneHandleId={propPaneHandleId}
              />
            ) : null}
          </>
        );
      })}
    </MockedSection>
  );
};

export const PropertyPaneZoneSpaceDistributor = ({
  zoneWidgetId,
}: {
  zoneWidgetId: string;
}) => {
  // Get the section widget containing the specified zone widget
  const sectionWidget = useSelector((state: AppState) =>
    getParentWidget(state, zoneWidgetId),
  );

  // Check if the section widget is not available
  if (!sectionWidget) {
    return null;
  }

  // Render the section splitter component for the corresponding section widget
  return (
    <PropertyPaneSectionSpaceDistributor
      sectionWidgetId={sectionWidget.widgetId}
    />
  );
};
