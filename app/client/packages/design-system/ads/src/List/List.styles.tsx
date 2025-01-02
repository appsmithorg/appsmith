import styled, { css } from "styled-components";
import type { ListSizes } from "./List.types";
import {
  ListItemBDescClassName,
  ListItemIDescClassName,
  ListItemTextOverflowClassName,
  ListItemTitleClassName,
} from "./List.constants";

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

export const ContentTextWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  gap: var(--ads-v2-spaces-1);
  flex: 1;
  flex-shrink: 0;
  flex-direction: column;

  & .${ListItemTextOverflowClassName} {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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

export const StyledList = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--ads-v2-spaces-1);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-2);
`;

export const StyledListItem = styled.div<{
  size: ListSizes;
}>`
  ${Variables};

  display: flex;
  width: 100%;
  align-items: center;
  cursor: pointer;
  box-sizing: border-box;
  position: relative;
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-2);
  padding-left: var(--ads-v2-spaces-3);

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
`;
