import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import { generateClassName } from "utils/generators";
import type { Elevations } from "./constants";

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
  border-radius: var(--border-radius-1);
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
      padding-block: var(--inner-spacing-1);
      padding-inline: var(--inner-spacing-1);
      `;
    }
  }}
`;

export function ContainerComponent(props: ContainerComponentProps) {
  return (
    <StyledContainerComponent
      className={`${generateClassName(props.widgetId)}`}
      data-elevation={props.elevatedBackground}
      elevatedBackground={props.elevatedBackground}
      elevation={props.elevation}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

export interface ContainerComponentProps {
  widgetId: string;
  children?: ReactNode;
  elevation: Elevations;
  elevatedBackground: boolean;
}
