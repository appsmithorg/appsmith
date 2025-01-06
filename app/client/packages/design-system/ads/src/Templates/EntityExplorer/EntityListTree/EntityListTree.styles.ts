import styled from "styled-components";
import { Flex } from "../../..";

/**
 * This is used to add a spacing when collapse icon is not present
 **/
export const CollapseSpacer = styled.div`
  width: 17px;
`;

export const PaddingOverrider = styled.div`
  width: 100%;

  & > div {
    /* Override the padding of the entity item since collapsible icon can be on the left
     * By default the padding on the left is 8px, so we need to reduce it to 4px
     **/
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

export const EntityItemWrapper = styled(Flex)<{ "data-depth": number }>`
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;

  padding-left: ${(props) => 4 + props["data-depth"] * 10}px;

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
