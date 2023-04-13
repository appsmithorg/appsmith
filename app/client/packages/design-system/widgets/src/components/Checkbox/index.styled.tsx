import styled from "styled-components";

import { Checkbox as HeadlessCheckbox } from "@design-system/headless";
import type { CheckboxProps as HeadlessCheckboxProps } from "@design-system/headless";

export const StyledCheckbox = styled(HeadlessCheckbox)<HeadlessCheckboxProps>`
  position: relative;
  width: 20px;
  height: 20px;

  .icon {
    width: 20px;
    height: 20px;
    border-width: 1px;
    border-style: solid;
    border-radius: var(--border-radius-1);
    border-color: var(--color-bd-neutral);
    color: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: top;
    user-select: none;
    flex-shrink: 0;
  }

  input {
    border: 0px;
    inset: 0 0 0 0;
    height: 100%;
    width: 100%;
    padding: 0px;
    opacity: 0;
    white-space: nowrap;
    position: absolute;
    cursor: default;
  }

  &:hover input:not(:disabled) + .icon {
    border-color: var(--color-bd-neutral-hover);
  }

  /**
 * ----------------------------------------------------------------------------
 * CHECKED  AND INDETERMINATE - BUT NOT DISABLED
 *-----------------------------------------------------------------------------
 */
  input:checked + .icon,
  input:indeterminate + .icon {
    background-color: var(--color-bg-accent);
    border-color: var(--color-bg-accent);
    color: white;
  }

  &:hover input:checked:not(:disabled) + .icon,
  &:hover input:indeterminate:not(:disabled) + .icon {
    border-color: var(--color-bg-accent-hover);
    background-color: var(--color-bg-accent-hover);
    color: theme("colors.white");
  }

  /**
  * ----------------------------------------------------------------------------
  * DISABLED
  *-----------------------------------------------------------------------------
  */
  input:disabled {
    cursor: not-allowed;
  }

  input:disabled + .icon {
    opacity: var(--opacity-disabled);
  }

  /**
  * ----------------------------------------------------------------------------
  * FOCUS
  *-----------------------------------------------------------------------------
  */
  input.focus-ring + .icon {
    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-bd-focus);
  }

  /**
 * ----------------------------------------------------------------------------
 * ERROR ( INVALID )
 *-----------------------------------------------------------------------------
 */
  input[aria-invalid] + .icon {
    border-color: var(--color-bd-negative);
  }

  &:hover input[aria-invalid] + .icon {
    border-color: var(--color-bd-negative-hover);
  }
`;
