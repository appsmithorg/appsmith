import styled from "styled-components";

import { TooltipContent as HeadlessTooltipContent } from "@design-system/headless";
import { TooltipTrigger as HeadlessTooltipTrigger } from "@design-system/headless";

export const StyledTooltipContent = styled(HeadlessTooltipContent)`
  background-color: var(--color-bg-assistive);
  color: var(--color-fg-on-assistive);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-1);

  [data-tooltip-trigger-arrow] {
    fill: var(--color-bg-assistive);
  }
`;
export const StyledTooltipTrigger = styled(HeadlessTooltipTrigger)``;
