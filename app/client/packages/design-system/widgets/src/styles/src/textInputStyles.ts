import { css } from "styled-components";
import type { TextInputProps as HeadlessTextInputProps } from "@design-system/headless";

// NOTE: these input styles are used in text area and text input
export const textInputStyles = css<HeadlessTextInputProps>`
  & [data-field-input] {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    border-radius: var(--border-radius-1);
    box-shadow: 0 0 0 1px var(--color-bd-neutral);
    padding-inline: var(--spacing-2);
    block-size: var(--sizing-8);
  }

  & [data-field-input] :is(input, textarea) {
    border: 0;
    background-color: transparent;
    font-family: inherit;
    flex-grow: 1;

    &:autofill,
    &:autofill:hover,
    &:autofill:focus,
    &:autofill:active {
      font-size: initial;
    }

    &:focus {
      outline: none;
    }
  }

  /**
* ----------------------------------------------------------------------------
* FOCUSSED
*-----------------------------------------------------------------------------
*/
  & [data-field-input][data-focused] {
    box-shadow: 0 0 0 2px var(--color-bd-focus);
  }

  & [data-field-input][data-disabled] {
    opacity: var(--opacity-disabled);
    cursor: default;
    user-select: none;
  }

  /**
* ----------------------------------------------------------------------------
* ERROR
*-----------------------------------------------------------------------------
*/
  & [data-field-input][data-invalid] {
    box-shadow: 0 0 0 1px var(--color-bd-negative);
  }

  & [data-field-input][data-invalid][data-focused] {
    box-shadow: 0 0 0 2px var(--color-bd-negative);
  }

  /**
* ----------------------------------------------------------------------------
* ICON
*-----------------------------------------------------------------------------
*/
  & [data-icon] {
    color: var(--color-fg-neutral);
  }

  /**
* ----------------------------------------------------------------------------
* DESCRIPTION
*-----------------------------------------------------------------------------
*/
  & [data-field-description-text] {
    color: var(--color-fg-neutral);
  }

  /**
* ----------------------------------------------------------------------------
* PLACEHOLDER
*-----------------------------------------------------------------------------
*/
  & [data-field-input] :is(input, textarea)::placeholder {
    color: var(--color-fg-neutral-subtle);
  }

  & [data-field-input] :is(input, textarea):placeholder-shown {
    text-overflow: ellipsis;
  }

  /**
* ----------------------------------------------------------------------------
* ICON BUTTON ( used in password input type )
*-----------------------------------------------------------------------------
*/
  & [data-icon-button] {
    block-size: calc(100% - var(--spacing-1));
  }
`;
