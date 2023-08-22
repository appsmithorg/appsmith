import styled from "styled-components";
import type { CheckboxGroupProps } from "./CheckboxGroup";
import { CheckboxGroup as HeadlessCheckboxGroup } from "@design-system/headless";

import { fieldStyles } from "../../../styles";

export const StyledCheckboxGroup = styled(
  HeadlessCheckboxGroup,
)<CheckboxGroupProps>`
  ${fieldStyles}
`;
