import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import styled from "styled-components";
import {
  getDistributionHandleId,
  getPropertyPaneDistributionHandleId,
  getPropertyPaneZoneId,
} from "layoutSystems/anvil/sectionSpaceDistributor/spaceDistributionUtils";
import { PropPaneDistributionHandleCustomEvent } from "layoutSystems/anvil/sectionSpaceDistributor/constants";

export interface SectionSplitterControlProps extends ControlProps {}

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

export class SectionSplitterControl extends BaseControl<SectionSplitterControlProps> {
  static getControlType() {
    return "SECTION_SPLITTER";
  }
  render() {
    const currentDistributedSpace = this.props.propertyValue;
    const allZoneIds = Object.keys(currentDistributedSpace);
    if (allZoneIds.length === 0) {
      return null;
    }

    return (
      <FlexBasedSection
        id={"prop-pane-" + this.props.widgetProperties.widgetId}
      >
        {allZoneIds.map((zoneId: string, index: number) => {
          const zoneValue = currentDistributedSpace[zoneId];
          const isNotLastZone = allZoneIds.length - 1 !== index;
          const distributionHandleId = getDistributionHandleId(zoneId);
          const propPaneZoneId = getPropertyPaneZoneId(zoneId);
          const dispatchMouseDownOnDistributionHandle = (e: any) => {
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
                  id={getPropertyPaneDistributionHandleId(zoneId)}
                  onMouseDown={dispatchMouseDownOnDistributionHandle}
                />
              ) : null}
            </>
          );
        })}
      </FlexBasedSection>
    );
  }
}
