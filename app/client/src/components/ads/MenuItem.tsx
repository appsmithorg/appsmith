import React, { forwardRef, ReactNode, Ref } from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Text, { TextType, FontWeight } from "./Text";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

export type MenuItemProps = CommonComponentProps & {
  icon?: IconName;
  text: string;
  label?: ReactNode;
  href?: string;
  type?: "warning";
  ellipsize?: number;
  selected?: boolean;
  containerClassName?: string;
  onSelect?: () => void;
};

const ItemRow = styled.a<{ disabled?: boolean; selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px ${(props) => props.theme.spaces[6]}px;
  background-color: ${(props) =>
    props.selected ? props.theme.colors.menuItem.hoverBg : "transparent"};
  .${Classes.TEXT} {
    color: ${(props) =>
      props.selected
        ? props.theme.colors.menuItem.hoverText
        : props.theme.colors.menuItem.normalText};
  }
  .${Classes.ICON} {
    svg {
      path {
        fill: ${(props) =>
          props.selected
            ? props.theme.colors.menuItem.hoverIcon
            : props.theme.colors.menuItem.normalIcon};
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
      background-color: ${
        props.type === "warning"
          ? props.theme.colors.menuItem.warning.bg
          : props.theme.colors.menuItem.hoverBg
      };
      .${Classes.TEXT} {
        color: ${
          props.type === "warning"
            ? props.theme.colors.menuItem.warning.color
            : props.theme.colors.menuItem.hoverText
        };
      }
      .${Classes.ICON} {
        path {
          fill: ${
            props.type === "warning"
              ? props.theme.colors.menuItem.warning.color
              : props.theme.colors.menuItem.hoverIcon
          };
        }
      }
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
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
`;
const MenuItem = forwardRef(
  (props: MenuItemProps, ref: Ref<HTMLAnchorElement>) => {
    return props.ellipsize && props.text.length > props.ellipsize ? (
      <TooltipComponent content={props.text} position={Position.BOTTOM}>
        <MenuItemContent ref={ref} {...props} />
      </TooltipComponent>
    ) : (
      <MenuItemContent ref={ref} {...props} />
    );
  },
);
const MenuItemContent = forwardRef(
  (props: MenuItemProps, ref: Ref<HTMLAnchorElement>) => {
    return (
      <ItemRow
        className={props.className}
        data-cy={props.cypressSelector}
        disabled={props.disabled}
        href={props.href}
        onClick={props.onSelect}
        ref={ref}
        selected={props.selected}
        type={props.type}
      >
        <IconContainer className={props.containerClassName}>
          {props.icon ? (
            <Icon
              isLoading={props.isLoading}
              loaderWithIconWrapper
              name={props.icon}
              size={IconSize.LARGE}
            />
          ) : null}
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
