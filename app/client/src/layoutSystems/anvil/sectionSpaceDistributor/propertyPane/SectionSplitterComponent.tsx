import React from "react";
import styled from "styled-components";
import {
  getDistributionHandleId,
  getPropertyPaneDistributionHandleId,
  getPropertyPaneZoneId,
} from "../spaceDistributionEditorUtils";
import { PropPaneDistributionHandleCustomEvent } from "../constants";
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { getParentWidget } from "selectors/widgetSelectors";
import type { AppState } from "@appsmith/reducers";
import type { WidgetLayoutProps } from "layoutSystems/anvil/utils/anvilTypes";

const FlexBasedSection = styled.div`
  background-color: var(--ads-v2-color-bg-emphasis);
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  border: 2px solid var(--ads-v2-color-bg-emphasis);
`;

const FlexChild = styled.div<{ flexGrow: number }>`
  display: flex;
  border-radius: 3px;
  background-color: var(--ads-v2-color-bg);
  flex-shrink: 1;
  height: 34px;
  align-items: center;
  justify-content: center;
  flex-grow: ${(props) => props.flexGrow};
`;

const Splitter = styled.div`
  display: flex;
  align-items: center;
  width: 10px;
  background-color: var(--ads-v2-color-bg-emphasis-plus);
  border: 3px solid var(--ads-v2-color-bg-emphasis);
  border-radius: 5px;
  cursor: col-resize;
  user-select: none;
  -webkit-user-select: none;
  &.active {
    background-color: #f86a2b;
  }
`;

export const SectionSplitterComponent = ({
  sectionWidgetId,
}: {
  sectionWidgetId: string;
}) => {
  const sectionWidget = useSelector(getWidgetByID(sectionWidgetId));
  const allZoneIdsInOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );
  const currentDistributedSpace = sectionWidget.spaceDistributed;
  if (!sectionWidget) {
    return null;
  }
  if (allZoneIdsInOrder.length === 0) {
    return null;
  }
  return (
    <FlexBasedSection id={"prop-pane-" + sectionWidgetId}>
      {allZoneIdsInOrder.map((zoneId: string, index: number) => {
        const zoneValue = currentDistributedSpace[zoneId];
        const isNotLastZone = allZoneIdsInOrder.length - 1 !== index;
        const distributionHandleId = getDistributionHandleId(zoneId);
        const propPaneZoneId = getPropertyPaneZoneId(zoneId);
        const onMouseDown = (e: any) => {
          e.stopPropagation();
          e.preventDefault();
          const distributionHandle =
            document.getElementById(distributionHandleId);
          if (distributionHandle) {
            distributionHandle.classList.add("active");
            distributionHandle.dispatchEvent(
              new CustomEvent(PropPaneDistributionHandleCustomEvent, {
                detail: {
                  mouseDownEvent: e,
                },
              }),
            );
          }
        };
        const propPaneHandleId = getPropertyPaneDistributionHandleId(zoneId);
        return (
          <>
            <FlexChild
              flexGrow={zoneValue}
              id={propPaneZoneId}
              key={propPaneZoneId}
            >
              {zoneValue}
            </FlexChild>
            {isNotLastZone ? (
              <Splitter
                id={propPaneHandleId}
                key={propPaneHandleId}
                onMouseDown={onMouseDown}
              />
            ) : null}
          </>
        );
      })}
    </FlexBasedSection>
  );
};

export const ZoneSplitterComponent = ({
  zoneWidgetId,
}: {
  zoneWidgetId: string;
}) => {
  const sectionWidget = useSelector((state: AppState) =>
    getParentWidget(state, zoneWidgetId),
  );
  if (!sectionWidget) {
    return null;
  }
  return <SectionSplitterComponent sectionWidgetId={sectionWidget.widgetId} />;
};
