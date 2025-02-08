import styled from "styled-components";
import { Flex } from "../../../Flex";
import { StyledListItem } from "../../../List/List.styles";

/**
 * This is used to add a spacing when collapse icon is not present
 **/
export const CollapseSpacer = styled.div`
  width: 17px;
`;

export const PaddingOverrider = styled.div`
  width: 100%;
  overflow-x: hidden;

  & > div {
    // Override the padding of the entity item since collapsible icon can be on the left
    // By default the padding on the left is 8px, so we need to reduce it to 4px

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
`;

export const EntityItemWrapper = styled(Flex)<{ "data-depth": number }>`
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  user-select: none;

  padding-left: ${(props) => {
    return 4 + props["data-depth"] * 8;
  }}px;

  /* selected style */
  // Set the selected style for wrapper and remove from list item

  &[data-selected="true"] {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }

  ${StyledListItem} {
    &[data-selected="true"] {
      background-color: unset;
    }
  }

  /* disabled style */
  // Set the disabled style for wrapper and remove from list item

  &[data-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--ads-v2-opacity-disabled);
    background-color: var(--ads-v2-colors-content-surface-default-bg);
  }

  ${StyledListItem} {
    &[data-disabled="true"] {
      background-color: unset;
    }
  }

  &:hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }

  &:active {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }
`;
