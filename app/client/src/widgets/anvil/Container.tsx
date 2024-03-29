import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import { generateClassName } from "utils/generators";
import type { Elevations } from "./constants";
import { Icon } from "design-system";

/**
 * This container component wraps the Zone and Section widgets and allows Anvil to utilise tokens from the themes
 * `elevatedBackground` is a boolean value that describes whether the elevation styles should be applied
 * `elevation` is the value of the elevation. Zones have a higher elevation than Sections.
 *
 * Also, in the case of zones, we're removing all padding.
 */
const StyledContainerComponent = styled.div<
  Omit<ContainerComponentProps, "widgetId">
>`
  height: 100%;
  width: 100%;
  outline: none;
  border: none;
  position: relative;
  /* If the elevatedBackground is true, then apply the elevation styles */
  ${(props) => {
    if (props.elevatedBackground) {
      return `
      background-color: var(--color-bg-elevation-${props.elevation});
      border-radius: var(--border-radius-elevation-${props.elevation})};
      border-color: var(--color-bd-elevation-${props.elevation});
      border-width: var(--border-width-1);
      border-style: solid;

      /* Add padding to the container to maintain the visual spacing rhythm */
      /* This is based on the hypothesis of asymmetric padding */
        padding-block:
        ${props.elevation === 1 ? 0 : "var(--outer-spacing-3)"};
  padding-inline: ${props.elevation === 1 ? 0 : "var(--outer-spacing-3)"};
      `;
    }
  }}
`;

const DragHandleBlock = styled.div`
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 20px;
  z-index: 3;
  background: var(--ads-section-focus);
  border-radius: var(--border-radius-1);
  position: absolute;
  top: 10px;
  left: -31px;
  pointer-events: auto;
  border-end-end-radius: var(--ads-radius-1);
  border-end-start-radius: var(--ads-radius-1);
  transform: rotate(90deg);
  & svg path:last-child {
    fill: var(--ads-section-focus);
  }

  :hover {
    background: var(--ads-section-selection);
  }
`;

function DragHandle() {
  return (
    <DragHandleBlock className="drag-handle-block">
      <Icon name="drag-handle" size="lg" />
    </DragHandleBlock>
  );
}

export function ContainerComponent(props: ContainerComponentProps) {
  return (
    <>
      {props.attachHandle && <DragHandle />}
      <StyledContainerComponent
        className={`${generateClassName(props.widgetId)}`}
        data-elevation={props.elevatedBackground}
        elevatedBackground={props.elevatedBackground}
        elevation={props.elevation}
      >
        {props.children}
      </StyledContainerComponent>
    </>
  );
}

export interface ContainerComponentProps {
  widgetId: string;
  children?: ReactNode;
  elevation: Elevations;
  elevatedBackground: boolean;
  attachHandle?: boolean;
}
