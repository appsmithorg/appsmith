import styled from "styled-components";
import { TextInput as HeadlessTextInput } from "@design-system/headless";

import { fieldStyles, textInputStyles } from "../../../styles";

export const StyledTextInput = styled(HeadlessTextInput)`
  ${fieldStyles}
  ${textInputStyles}
`;
