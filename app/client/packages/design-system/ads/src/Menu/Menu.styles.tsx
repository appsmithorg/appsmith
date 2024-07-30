import styled, { css } from "styled-components";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import type { MenuSizes } from "./Menu.types";
import {
  MenuItemChildrenClassName,
  MenuItemEndIconClassName,
} from "./Menu.constants";

const Variables = css`
  --menu-item-padding: var(--ads-v2-spaces-3);
  --menu-item-gap: var(--ads-v2-spaces-3);
  --menu-item-color-bg: var(--ads-v2-colors-content-surface-default-bg);
  --menu-item-font-size: var(--ads-v2-font-size-4);
  --menu-item-height: 36px;
`;

const MenuItemSizeStyles = {
  sm: css`
    --menu-item-padding: var(--ads-v2-spaces-2);
    --menu-item-gap: var(--ads-v2-spaces-2);
    --menu-item-font-size: var(--ads-v2-font-size-2);
    --menu-item-height: 22px;
  `,
  md: css`
    --menu-item-padding: var(--ads-v2-spaces-3);
    --menu-item-gap: var(--ads-v2-spaces-3);
    --menu-item-font-size: var(--ads-v2-font-size-4);
    --menu-item-height: 36px;
  `,
};

const MenuContentStyle = css`
  ${Variables};

  width: fit-content;
  min-width: 100px;
  max-width: 280px;
  max-height: calc(var(--radix-dropdown-menu-content-available-height) - 20px);
  background-color: var(--ads-v2-colors-content-surface-default-bg);
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-colors-content-container-default-border);
  box-shadow: var(--ads-v2-shadow-popovers);
  padding: var(--ads-v2-spaces-2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  overflow: auto;
  z-index: 1001;
`;

export const StyledMenuContent = styled(RadixMenu.Content)<{
  height?: string;
  width?: string;
}>`
  ${MenuContentStyle};
  ${({ width }) => width && `width: ${width};`}
  ${({ height }) => height && `height: ${height};`}
`;

export const StyledMenuSubContent = styled(RadixMenu.SubContent)<{
  height?: string;
  width?: string;
}>`
  ${MenuContentStyle};
  ${({ width }) => width && `width: ${width};`}
  ${({ height }) => height && `height: ${height};`}
`;

const MenuItemStyle = css`
  display: flex;
  align-items: center;
  padding: var(--menu-item-padding);
  margin-bottom: var(--ads-v2-spaces-1);
  gap: var(--menu-item-gap);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  background-color: var(--menu-item-color-bg);
  position: relative;
  color: var(--ads-v2-colors-content-label-default-fg);
  min-height: var(--menu-item-height);
  box-sizing: border-box;

  & > .${MenuItemEndIconClassName} {
    position: relative;
    right: 0;
  }

  & > .${MenuItemChildrenClassName} {
    flex: 1;
    width: 100%;
    font-size: var(--menu-item-font-size);
    line-height: unset;
    overflow: hidden;
    overflow-wrap: break-word;
  }

  &:hover:not([data-disabled]),
  &:focus-visible {
    --menu-item-color-bg: var(--ads-v2-colors-content-surface-hover-bg);
    outline: none;
  }

  &:focus-visible:not(:hover) {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }

  &:active:not([data-disabled]) {
    --menu-item-color-bg: var(--ads-v2-colors-content-surface-active-bg);
  }

  &[data-disabled] {
    cursor: not-allowed;
    opacity: var(--ads-v2-opacity-disabled);
  }
`;

export const StyledMenuItem = styled(RadixMenu.Item)<{
  size?: MenuSizes;
}>`
  ${MenuItemStyle}

  ${({ size }) => size && MenuItemSizeStyles[size]}
`;

export const StyledMenuSubTrigger = styled(RadixMenu.SubTrigger)<{
  size?: MenuSizes;
}>`
  ${MenuItemStyle}

  ${({ size }) => size && MenuItemSizeStyles[size]}

  &[data-state="open"] {
    --menu-item-color-bg: var(--ads-v2-colors-content-surface-active-bg);
  }
`;

export const StyledMenuSeparator = styled(RadixMenu.Separator)`
  height: 1px;
  background-color: var(--ads-v2-colors-content-surface-default-border);
  width: 100%;
  display: list-item;

  &::marker {
    content: "";
  }
`;

export const StyledMenuGroupname = styled(RadixMenu.Label)`
  font-size: var(--ads-v2-font-size-2);
  color: var(--ads-v2-color-fg-muted);
  font-weight: var(--ads-v2-font-weight-bold);
  padding: 0 var(--menu-item-padding);
`;
