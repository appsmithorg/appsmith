import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import { generateClassName } from "utils/generators";
import type { Elevations } from "./constants";
import { Icon } from "design-system";
import { getIsEditorOpen } from "layoutSystems/anvil/integrations/onCanvasUISelectors";
import { useSelector } from "react-redux";
import { isWidgetSelected } from "selectors/widgetSelectors";

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

const DragHandleBlock = styled.div<{ $highlight: boolean }>`
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 20px;
  z-index: -1;
  background: ${(props) =>
    !props.$highlight
      ? "var(--ads-section-focus)"
      : "var(--ads-section-selection)"};
  border-radius: var(--border-radius-1);
  position: absolute;
  top: 10px;
  left: -25px;
  pointer-events: auto;
  border-end-end-radius: var(--ads-radius-1);
  border-end-start-radius: var(--ads-radius-1);
  transform: rotate(90deg);
  ${(props) => (props.$highlight ? "z-index: 1;" : "")}
  & svg path:last-child {
    fill: var(--ads-section-focus);
  }

  :hover {
    background: var(--ads-section-selection);
  }
`;

function DragHandle(props: { highlight: boolean }) {
  return (
    <DragHandleBlock $highlight={props.highlight} className="drag-handle-block">
      <Icon name="drag-handle" size="lg" />
    </DragHandleBlock>
  );
}

export function ContainerComponent(props: ContainerComponentProps) {
  const isEditor = useSelector(getIsEditorOpen);
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  return (
    <>
      {props.attachHandle && isEditor && <DragHandle highlight={isSelected} />}
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
