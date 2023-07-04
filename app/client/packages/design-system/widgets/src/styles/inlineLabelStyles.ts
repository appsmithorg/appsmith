// Note: these styles will shared across radio, Radio and toggle components

import { css } from "styled-components";
import type { InlineLabelProps } from "@design-system/headless";

export const inlineLabelStyles = css<InlineLabelProps>`
  position: relative;
  display: flex;
  gap: var(--spacing-2);
  cursor: pointer;

  ${({ labelPosition }) => css`
    justify-content: ${labelPosition === "left" ? "space-between" : undefined};
    flex-direction: ${labelPosition === "left" ? "row-reverse" : "row"};
  `};

  &[data-label] {
    min-height: calc(5 * var(--root-unit));
    display: flex;
    align-items: center;
  }

  /**
  * ----------------------------------------------------------------------------
  * DISABLED
  *-----------------------------------------------------------------------------
  */
  &[data-disabled] {
    opacity: var(--opacity-disabled);
    cursor: default;
  }
`;
