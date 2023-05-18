import styled from "styled-components";
import { CheckboxGroup as HeadlessCheckboxGroup } from "@design-system/headless";

import { fieldStyles } from "../../styles/fieldStyles";
import type { CheckboxGroupProps } from "./CheckboxGroup";

export const StyledCheckboxGroup = styled(
  HeadlessCheckboxGroup,
)<CheckboxGroupProps>`
  ${fieldStyles}
`;
