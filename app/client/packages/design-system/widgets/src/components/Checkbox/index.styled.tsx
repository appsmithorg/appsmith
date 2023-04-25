import styled, { css } from "styled-components";
import { Checkbox as HeadlessCheckbox } from "@design-system/headless";

import type { CheckboxProps } from ".";

// Note: these styles will shared across radio, checkbox and toggle components
// so we will be moving the types (labelPosition) and styles to a common place
export const labelStyles = css<Pick<CheckboxProps, "labelPosition">>`
  position: relative;
  display: flex;
  gap: var(--spacing-2);

  ${({ labelPosition }) => css`
    justify-content: ${labelPosition === "left" ? "space-between" : undefined};
    flex-direction: ${labelPosition === "left" ? "row-reverse" : "row"};
  `};

  .label {
    min-height: calc(5 * var(--sizing-root-unit));
    display: flex;
    align-items: center;
  }
`;

export const StyledCheckbox = styled(HeadlessCheckbox)<CheckboxProps>`
  ${labelStyles}

  .icon {
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

  &.is-hovered:not(.is-disabled) .icon {
    border-color: var(--color-bd-neutral-hover);
  }

  /**
 * ----------------------------------------------------------------------------
 * CHECKED  AND INDETERMINATE - BUT NOT DISABLED
 *-----------------------------------------------------------------------------
 */
  &.is-checked .icon,
  &.is-indeterminate .icon {
    background-color: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
    color: var(--color-fg-on-accent);
  }

  &.is-hovered.is-checked:not(.is-disabled) .icon,
  &.is-hovered.is-indeterminate:not(.is-disabled) .icon {
    border-color: var(--color-bg-accent-hover);
    background-color: var(--color-bg-accent-hover);
    color: var(--color-fg-on-accent);
  }

  /**
  * ----------------------------------------------------------------------------
  * DISABLED
  *-----------------------------------------------------------------------------
  */
  &.is-disabled {
    cursor: not-allowed;
    opacity: var(--opacity-disabled);
  }

  /**
  * ----------------------------------------------------------------------------
  * FOCUS
  *-----------------------------------------------------------------------------
  */
  &.is-focused .icon {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  /**
 * ----------------------------------------------------------------------------
 * ERROR ( INVALID )
 *-----------------------------------------------------------------------------
 */
  &.is-invalid .icon {
    border-color: var(--color-bd-negative);
  }

  &.is-hovered.is-invalid .icon {
    border-color: var(--color-bd-negative-hover);
  }
`;
