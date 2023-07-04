import styled from "styled-components";
import { RadioGroup as HeadlessRadioGroup } from "@design-system/headless";

import { fieldStyles } from "../../styles/fieldStyles";
import type { RadioGroupProps } from "./RadioGroup";

export const StyledRadioGroup = styled(HeadlessRadioGroup)<RadioGroupProps>`
  ${fieldStyles}
`;
