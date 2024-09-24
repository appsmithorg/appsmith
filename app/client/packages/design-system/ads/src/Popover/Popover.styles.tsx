import styled, { css } from "styled-components";
import type { PopoverSize } from "./Popover.types";
import { Content } from "@radix-ui/react-popover";
import { Text } from "../Text";

const Variables = css`
  --popover-padding: var(--ads-v2-spaces-4);
  --popover-width: unset;
  --popover-max-height: unset;
`;

// Variant style definitions
const Size = {
  sm: css`
    --popover-padding: var(--ads-v2-spaces-4);
    --popover-width: 250px;
    --popover-max-height: 400px;
  `,
  md: css`
    --popover-padding: var(--ads-v2-spaces-5);
    --popover-width: 400px;
    --popover-max-height: 600px;
  `,
};

export const StyledContent = styled(Content)<{ $size: PopoverSize }>`
  ${Variables};

  ${({ $size }) => $size && Size[$size]};

  padding: var(--popover-padding);

  background-color: var(--ads-v2-colors-content-surface-default-bg);
  border: 1px solid var(--ads-v2-colors-content-container-default-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);

  width: var(--popover-width);
  max-height: var(--popover-max-height);

  // to separate it from the bottom of the screen when it overflows
  margin-bottom: var(--ads-v2-spaces-4);
  z-index: 1001;
`;

export const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--ads-v2-spaces-4);
`;

// TODO: Replace below rules with correct text kind when text is developed.
export const StyledHeaderText = styled(Text)`
  --color: var(--ads-v2-colors-content-header-default-fg);
  --font-size: var(--ads-v2-font-size-6);
  --font-weight: 600;
  --line-height: 1.5;
`;

export const StyledBody = styled.div`
  flex: 1;
  // 25.5px is the line height of the header text.
  // This code assumes that the header will always span exactly one line.
  max-height: calc(
    var(--popover-max-height) - calc(var(--popover-padding) * 2 + 25.5px)
  );
  overflow-y: scroll;
`;
