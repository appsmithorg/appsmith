import styled from "styled-components";
import { Flex } from "design-system";

export const StyledTab = styled(Flex)`
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  font-size: 12px;
  color: var(--ads-v2-colors-text-default);
  cursor: pointer;
  gap: var(--ads-v2-spaces-2);
  &.active {
    background-color: var(--ads-v2-colors-control-knob-default-bg);
    color: var(--ads-v2-colors-text-default);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12);
  }
`;
