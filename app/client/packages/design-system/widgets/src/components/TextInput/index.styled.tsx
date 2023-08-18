import styled from "styled-components";
import { TextInput as HeadlessTextInput } from "@design-system/headless";

import type { TextInputProps } from ".";
import { fieldStyles } from "../../styles/fieldStyles";

export const StyledTextInput = styled(HeadlessTextInput)<TextInputProps>`
  ${fieldStyles}

  & [data-field-input-wrapper] {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    border-radius: var(--border-radius-1);
    box-shadow: 0 0 0 1px var(--color-bd-neutral);
    padding-inline: var(--spacing-1);
    block-size: var(--sizing-8);
  }

  & [data-field-input] {
    border: 0;
    background-color: transparent;
    width: auto;

    &:focus {
      outline: none;
    }
  }

  /**
  * ----------------------------------------------------------------------------
  * FOCUSSED
  *-----------------------------------------------------------------------------
  */
  & [data-field-input-wrapper][data-focused] {
    box-shadow: 0 0 0 2px var(--color-bd-focus);
  }

  & [data-field-input-wrapper][data-disabled] {
    opacity: var(--opacity-disabled);
    cursor: default;
    user-select: none;
  }
`;
