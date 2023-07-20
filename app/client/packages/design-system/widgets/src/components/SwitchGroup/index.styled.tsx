import styled from "styled-components";
import { CheckboxGroup as HeadlessSwitchGroup } from "@design-system/headless";

import { fieldStyles } from "../../styles/fieldStyles";
import type { SwitchGroupProps } from "./SwitchGroup";

export const StyledSwitchGroup = styled(HeadlessSwitchGroup)<SwitchGroupProps>`
  ${fieldStyles}
`;
