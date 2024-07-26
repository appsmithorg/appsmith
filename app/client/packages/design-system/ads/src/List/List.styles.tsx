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

export const StyledList = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--ads-v2-spaces-1);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-2);
`;

export const Wrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  cursor: pointer;
  box-sizing: border-box;
  position: relative;
`;

export const TooltipTextWrapper = styled.div`
  display: flex;
  min-width: 0;
`;

export const ContentWrapper = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-3);
`;

export const ContentTextWrapper = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-3);
  flex: 1;
  min-width: 0;
`;

export const DescriptionWrapper = styled.div`
  flex-direction: column;
  min-width: 0;
  gap: var(--ads-v2-spaces-3);
  display: flex;
`;

export const InlineDescriptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
  gap: var(--ads-v2-spaces-3);
  flex: 1;
`;

export const EndIconWrapper = styled.div`
  position: absolute;
  right: var(--ads-v2-spaces-3);
`;

export const StyledListItem = styled.div<{
  size: ListSizes;
  endIcon?: string;
  isBlockDescription: boolean;
}>`
  ${Variables};

  display: flex;
  width: 100%;
  align-items: center;
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-3);
  box-sizing: border-box;
  // 40px is the offset to make it look like the end icon is part of this div
  ${(props) => !!props.endIcon && `padding: 8px 40px 8px 8px;`}}

  ${({ size }) => Sizes[size]}


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
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    text-overflow: initial;
    white-space: initial;
    font-size: var(--listitem-bdescription-font-size);
    line-height: normal;
  }

  & .${ListItemIDescClassName} {
    font-size: var(--listitem-idescription-font-size);
  }

  &:hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }

  &:active {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }

  &[data-selected="true"] {
    background-color: var(--ads-v2-colors-content-surface-active-bg);
  }

  /* disabled style */
  &[data-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--ads-v2-opacity-disabled);
  }

  /* Focus styles */
  &:focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;
