import styled, { css } from "styled-components";
import type { ListSizes } from "./List.types";
import {
  ListItemBDescClassName,
  ListItemIDescClassName,
  ListItemTextOverflowClassName,
  ListItemTitleClassName,
} from "./List.constants";
import { Flex } from "../Flex";
import { Text } from "../Text";

const Variables = css`
  --listitem-title-font-size: var(--ads-v2-font-size-4);
  --listitem-bdescription-font-size: var(--ads-v2-font-size-2);
  --listitem-idescription-font-size: var(--ads-v2-font-size-2);
`;

const Sizes = {
  md: css`
    --listitem-title-font-size: var(--ads-v2-font-size-4);
    --listitem-bdescription-font-size: var(--ads-v2-font-size-2);
    --listitem-idescription-font-size: var(--ads-v2-font-size-2);
  `,
  lg: css`
    --listitem-title-font-size: var(--ads-v2-font-size-6);
    --listitem-bdescription-font-size: var(--ads-v2-font-size-4);
    --listitem-idescription-font-size: var(--ads-v2-font-size-4);
  `,
};

export const TooltipTextWrapper = styled.div`
  display: flex;
  min-width: 0;
`;

export const RightControlWrapper = styled.div`
  height: 100%;
  line-height: normal;
  display: flex;
  align-items: center;

  button {
    margin-left: -4px;
  }
`;

export const TopContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  min-width: 0;
  height: 24px;
  width: 100%;
`;

export const BottomContentWrapper = styled.div`
  padding-left: var(--ads-v2-spaces-7);
  padding-bottom: var(--ads-v2-spaces-2);
`;

export const InlineDescriptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  min-width: 0;
`;

export const StyledList = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--ads-v2-spaces-1);
  display: flex;
  flex-direction: column;
`;

export const StyledListItem = styled.div<{
  size: ListSizes;
}>`
  ${Variables};

  display: flex;
  width: 100%;
  cursor: pointer;
  box-sizing: border-box;
  position: relative;
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-2);
  padding-left: var(--ads-v2-spaces-3);
  gap: var(--ads-v2-spaces-1);
  flex-shrink: 0;
  flex-direction: column;

  ${({ size }) => Sizes[size]}

  &[data-rightcontrolvisibility="hover"] {
    ${RightControlWrapper} {
      display: none;
    }

    &:hover ${RightControlWrapper} {
      display: block;
    }
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

  & .${ListItemTextOverflowClassName} {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
  }

  & .${ListItemTitleClassName} {
    font-size: var(--listitem-title-font-size);
    line-height: 16px;
  }

  & .${ListItemBDescClassName} {
    -webkit-line-clamp: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    text-overflow: initial;
    white-space: initial;
    font-size: var(--listitem-bdescription-font-size);
    line-height: normal;
  }

  & .${ListItemIDescClassName} {
    font-size: var(--listitem-idescription-font-size);
    line-height: 16px;
    padding-right: var(--ads-v2-spaces-2);
  }
`;

export const StyledGroup = styled(Flex)`
  & .ads-v2-listitem .ads-v2-listitem__idesc {
    opacity: 0;
  }

  & .ads-v2-listitem:hover .ads-v2-listitem__idesc {
    opacity: 1;
  }
`;

export const GroupedList = styled(StyledList)`
  padding: 0;
`;

export const GroupTitle = styled(Text)`
  padding: var(--ads-v2-spaces-1) 0;
  color: var(--ads-v2-color-fg-muted);
`;
