import styled from "styled-components";
import { TextArea as HeadlessTextArea } from "@design-system/headless";

import { fieldStyles, textInputStyles } from "../../../styles";

export const StyledTextArea = styled(HeadlessTextArea)`
  ${fieldStyles}
  ${textInputStyles}

  & [data-field-input] {
    block-size: auto;
  }

  & [data-field-input] textarea {
    height: auto;
    resize: none;
    min-block-size: var(--sizing-16);
    align-items: flex-start;
  }
`;
