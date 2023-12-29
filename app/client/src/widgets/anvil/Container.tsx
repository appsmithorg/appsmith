import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import { generateClassName } from "utils/generators";
import { Elevations } from "./constants";

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
  overflow: hidden;
  outline: none;
  border: none;
  position: relative;

  ${(props) =>
    props.elevatedBackground
      ? `background: var(--color-bg-elevation-${props.elevation}); box-shadow: var(--box-shadow-${props.elevation});`
      : ""}

  border-radius: var(--border-radius-1);
  padding-block: var(--outer-spacing-1);
  padding-inline: var(--outer-spacing-1);
  ${(props) =>
    props.elevation === Elevations.SECTION_ELEVATION
      ? `padding-block: var(--outer-spacing-0); padding-inline: var(--outer-spacing-0);`
      : ""}

  border-width: var(--border-width-1);
`;

export function ContainerComponent(props: ContainerComponentProps) {
  return (
    <StyledContainerComponent
      className={`${generateClassName(props.widgetId)}`}
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
