import styled from "styled-components";
import { Flex } from "design-system";

export const StyledTab = styled(Flex)`
  position: relative;
  top: 1px;
  border-top: 1px solid transparent;
  border-top-left-radius: var(--ads-v2-border-radius);
  border-top-right-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  font-size: 12px;
  color: var(--ads-v2-colors-text-default);
  cursor: pointer;
  gap: var(--ads-v2-spaces-2);

  // After element - the seperator in between tabs
  &:not(&.active):not(:has(+ .active)):not(:last-child):after {
    content: "";
    position: absolute;
    right: 0;
    top: 8px;
    width: 1px;
    height: 40%;
    background-color: var(--ads-v2-color-border);
  }

  &.active {
    background-color: var(--ads-v2-colors-control-knob-default-bg);
    color: var(--ads-v2-colors-text-default);
    border-top: 1px solid var(--ads-v2-color-bg-brand);
    box-shadow:
      1px 0px 0px 0px var(--ads-v2-color-border) inset,
      -1px 0px 0px 0px var(--ads-v2-color-border) inset;
  }
`;
