import styled, { css } from "styled-components";
import { TooltipContent as HeadlessTooltipContent } from "@design-system/headless";
import { TooltipTrigger as HeadlessTooltipTrigger } from "@design-system/headless";

import type { TooltipContentProps as HeadlessTooltipContentProps } from "@design-system/headless";

type StyledTooltipContentProps = HeadlessTooltipContentProps & {
  $isRounded?: boolean;
};

export const StyledTooltipContent = styled(
  HeadlessTooltipContent,
)<StyledTooltipContentProps>`
  background-color: var(--color-bg-assistive);
  color: var(--color-fg-on-assistive);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-1);

  [data-tooltip-trigger-arrow] {
    fill: var(--color-bg-assistive);
  }

  ${({ $isRounded }) =>
    $isRounded &&
    css`
      &:is(
          [data-tooltip-placement="left-start"],
          [data-tooltip-placement="left"],
          [data-tooltip-placement="left-end"]
        )
        [data-tooltip-trigger-arrow] {
        margin-left: -2px;
      }

      &:is(
          [data-tooltip-placement="right-start"],
          [data-tooltip-placement="right"],
          [data-tooltip-placement="right-end"]
        )
        [data-tooltip-trigger-arrow] {
        margin-right: -2px;
      }
    `}
`;

export const StyledTooltipTrigger = styled(HeadlessTooltipTrigger)``;
