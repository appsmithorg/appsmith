import styled from "styled-components";
import { Flex } from "../../..";

export const CollapseSpacer = styled.div`
  width: 12px;
`;

export const PaddingOverrider = styled.div`
  width: 100%;

  & > div {
    padding-left: 4px;
  }
`;

export const CollapseWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 16px;
  width: 16px;
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;

  :hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }
`;

export const EntityItemWrapper = styled(Flex)`
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;

  &[data-depth="0"] {
    padding-left: 4px;
  }

  &[data-depth="1"] {
    padding-left: 14px;
  }

  &[data-depth="2"] {
    padding-left: 24px;
  }

  &[data-depth="3"] {
    padding-left: 34px;
  }

  &[data-depth="4"] {
    padding-left: 44px;
  }

  &[data-depth="5"] {
    padding-left: 54px;
  }

  &[data-selected="true"] {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }

  /* disabled style */

  &[data-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--ads-v2-opacity-disabled);
    background-color: var(--ads-v2-colors-content-surface-default-bg);
  }

  &:hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }

  &:active {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }

  /* Focus styles */

  &:focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;
