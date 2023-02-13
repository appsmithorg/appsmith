import styled from "styled-components";

import { CheckboxProps } from "./Checkbox";

export const Container = styled.div<Pick<CheckboxProps, "labelPosition">>`
  position: relative;
  width: 20px;
  height: 20px;
  order: ${({ labelPosition }) => (labelPosition === "left" ? "2" : "1")};
`;

export const Icon = styled.span`
  width: 20px;
  height: 20px;
  border-width: 1px;
  border-style: solid;
  border-image: initial;
  border-radius: var(--wds-v2-radii);
  border-color: var(--wds-color-border);
  color: transparent;
  display: inline-flex;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  vertical-align: top;
  user-select: none;
  flex-shrink: 0;
`;

export const Input = styled.input`
  border: 0px;
  inset: 0 0 0 0;
  height: 100%;
  width: 100%;
  padding: 0px;
  opacity: 0;
  white-space: nowrap;
  position: absolute;
  cursor: default;

  ${Container}:hover &:not(:disabled) + ${Icon} {
    border-color: var(--wds-color-border-hover);
  }

  /**
 * ----------------------------------------------------------------------------
 * CHECKED  AND INDETERMINATE - BUT NOT DISABLED
 *-----------------------------------------------------------------------------
 */
  &:checked:not(:disabled) + ${Icon}, &:indeterminate:not(:disabled) + ${Icon} {
    background-color: var(--wds-color-accent);
    border-color: var(--wds-color-accent);
    color: white;
  }

  ${Container}:hover
    &:checked:not(:disabled)
    + ${Icon},
    ${Container}:hover
    &:indeterminate:not(:disabled)
    + ${Icon} {
    border-color: var(--wds-color-accent-hover);
    background-color: var(--wds-color-accent-hover);
    color: theme("colors.white");
  }

  /**
 * ----------------------------------------------------------------------------
 * DISABLED
 *-----------------------------------------------------------------------------
 */
  &:disabled {
    cursor: not-allowed;
  }

  &:disabled + ${Icon} {
    background-color: var(--wds-color-bg-disabled);
    border-color: var(--wds-color-border-disabled);
  }

  &:checked:disabled + ${Icon}, &:indeterminate:disabled + ${Icon} {
    color: var(--wds-color-bg-disabled-strong);
  }

  /**
 * ----------------------------------------------------------------------------
 * ERROR ( INVALID )
 *-----------------------------------------------------------------------------
 */

  &:invalid + ${Icon} {
    border-color: var(--wds-color-border-danger);
  }

  ${Container}:hover &:invalid + ${Icon} {
    border-color: var(--wds-color-border-danger-hover);
  }

  /**
 * ----------------------------------------------------------------------------
 * FOCUSED
 *-----------------------------------------------------------------------------
 */
  .input[data-focus-visible-added] + ${Icon} {
    outline: 1px solid var(--wds-color-border-focus);
    outline-offset: 2px;
  }

  /**
 * ----------------------------------------------------------------------------
 * CHECKBOX GROUP
 *-----------------------------------------------------------------------------
 */
  .inputs-group {
    display: flex;
    gap: theme("spacing.2");
  }

  .inputs-group.horizontal {
    flex-direction: row;
  }

  .inputs-group.vertical {
    flex-direction: column;
  }
`;
