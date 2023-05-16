import styled, { css } from "styled-components";
import { Checkbox as HeadlessCheckbox } from "@design-system/headless";

import type { CheckboxProps } from ".";

// Note: these styles will shared across radio, checkbox and toggle components
// so we will be moving the types (labelPosition) and styles to a common place
export const labelStyles = css<Pick<CheckboxProps, "labelPosition">>`
  position: relative;
  display: flex;
  gap: var(--spacing-2);
  cursor: pointer;

  ${({ labelPosition }) => css`
    justify-content: ${labelPosition === "left" ? "space-between" : undefined};
    flex-direction: ${labelPosition === "left" ? "row-reverse" : "row"};
  `};

  &[data-label] {
    min-height: calc(5 * var(--sizing-root-unit));
    display: flex;
    align-items: center;
  }

  /**
  * ----------------------------------------------------------------------------
  * DISABLED
  *-----------------------------------------------------------------------------
  */
  &[data-disabled] {
    pointer-events: none;
    opacity: var(--opacity-disabled);
  }
`;

export const StyledCheckbox = styled(HeadlessCheckbox)<CheckboxProps>`
  ${labelStyles}

  [data-icon] {
    width: calc(5 * var(--sizing-root-unit));
    height: calc(5 * var(--sizing-root-unit));
    border-width: var(--border-width-1);
    border-style: solid;
    border-radius: var(--border-radius-1);
    border-color: var(--color-bd-neutral);
    color: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    flex-shrink: 0;
  }

  &[data-hovered]:not([data-disabled]) [data-icon] {
    border-color: var(--color-bd-neutral-hover);
  }

  /**
 * ----------------------------------------------------------------------------
 * CHECKED  AND INDETERMINATE - BUT NOT DISABLED
 *-----------------------------------------------------------------------------
 */
  &[data-state="checked"] [data-icon],
  &[data-state="indeterminate"] [data-icon] {
    background-color: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
    color: var(--color-fg-on-accent);
  }

  &[data-hovered][data-state="checked"]:not([data-disabled]) [data-icon],
  &[data-hovered][data-state="indeterminate"]:not([data-disabled]) [data-icon] {
    border-color: var(--color-bg-accent-hover);
    background-color: var(--color-bg-accent-hover);
    color: var(--color-fg-on-accent);
  }

  /**
  * ----------------------------------------------------------------------------
  * FOCUS
  *-----------------------------------------------------------------------------
  */
  &[data-focused] [data-icon] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  /**
 * ----------------------------------------------------------------------------
 * ERROR ( INVALID )
 *-----------------------------------------------------------------------------
 */
  &[data-invalid] [data-icon] {
    border-color: var(--color-bd-negative);
  }

  &[data-hovered][data-invalid] [data-icon] {
    border-color: var(--color-bd-negative-hover);
  }
`;
