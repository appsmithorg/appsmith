import type { ReactNode, Ref } from "react";
import React, { forwardRef } from "react";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";
import styled from "styled-components";
import type { IconNames } from "@appsmith/ads";
import { Icon } from "@appsmith/ads";
import TooltipComponent from "../Tooltip";
import Text, { TextType, FontWeight } from "../Text";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { PopoverPosition } from "@blueprintjs/core/lib/esnext/components/popover/popoverSharedProps";

export type MenuItemProps = CommonComponentProps & {
  icon?: IconNames;
  text: string;
  label?: ReactNode;
  href?: string;
  type?: "warning";
  ellipsize?: number;
  selected?: boolean;
  containerClassName?: string;
  onSelect?: (e: React.MouseEvent, ...rest: any) => void;
  tooltipPos?: PopoverPosition; // tooltip position of menu item
};

const ItemRow = styled.a<{ disabled?: boolean; selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px var(--ads-spaces-6);
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg-muted)" : "transparent"};
  .${Classes.TEXT} {
    color: var(--ads-v2-color-fg);
  }
  .${Classes.ICON} {
    svg {
      path {
        fill: var(--ads-v2-color-fg);
      }
    }
  }
  height: 38px;

  ${(props) =>
    !props.disabled
      ? `
    &:hover {
      text-decoration: none;
      cursor: pointer;
      background-color: var(--ads-v2-color-bg-subtle);
      border-radius: var(--ads-v2-border-radius);
    }`
      : `
    &:hover {
      text-decoration: none;
      cursor: default;
    }
    `}
`;

const IconContainer = styled.span`
  display: flex;
  align-items: center;

  .${Classes.ICON} {
    margin-right: var(--ads-spaces-5);
  }
`;
const MenuItem = forwardRef(
  (props: MenuItemProps, ref: Ref<HTMLAnchorElement>) => {
    return props.ellipsize && props.text.length > props.ellipsize ? (
      <TooltipComponent
        content={props.text}
        position={props.tooltipPos || "bottom"}
      >
        <MenuItemContent ref={ref} {...props} />
      </TooltipComponent>
    ) : (
      <MenuItemContent ref={ref} {...props} />
    );
  },
);
const MenuItemContent = forwardRef(
  (props: MenuItemProps, ref: Ref<HTMLAnchorElement>) => {
    const { onSelect } = props;
    return (
      <ItemRow
        className={props.className}
        data-cy={props.cypressSelector}
        data-testid={`t--${props.className}`}
        disabled={props.disabled}
        href={props.href}
        onClick={onSelect}
        ref={ref}
        selected={props.selected}
        type={props.type}
      >
        <IconContainer className={props.containerClassName}>
          {props.icon ? <Icon name={props.icon} size="md" /> : null}
          {props.text && (
            <Text type={TextType.H5} weight={FontWeight.NORMAL}>
              {props.ellipsize
                ? ellipsize(props.ellipsize, props.text)
                : props.text}
            </Text>
          )}
        </IconContainer>
        {props.label ? props.label : null}
      </ItemRow>
    );
  },
);
MenuItemContent.displayName = "MenuItemContent";
MenuItem.displayName = "MenuItem";

function ellipsize(length: number, text: string) {
  return text.length > length ? text.slice(0, length).concat(" ...") : text;
}

export default MenuItem;
