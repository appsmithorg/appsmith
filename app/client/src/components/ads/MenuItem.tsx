import React, { ReactNode } from "react";
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
  ellipsize?: number;
  onSelect?: () => void;
};

const ItemRow = styled.a<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px ${props => props.theme.spaces[6]}px;
  .${Classes.TEXT} {
    color: ${props => props.theme.colors.menuItem.normalText};
  }
  .${Classes.ICON} {
    svg {
      path {
        fill: ${props => props.theme.colors.menuItem.normalIcon};
      }
    }
  }
  height: 38px;

  ${props =>
    !props.disabled
      ? `
    &:hover {
      text-decoration: none;
      cursor: pointer;
      background-color: ${props.theme.colors.menuItem.hoverBg};
      .${Classes.TEXT} {
        color: ${props.theme.colors.menuItem.hoverText};
      }
      .${Classes.ICON} {
        path {
          fill: ${props.theme.colors.menuItem.hoverIcon};
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
    margin-right: ${props => props.theme.spaces[5]}px;
  }
`;

function MenuItem(props: MenuItemProps) {
  return props.ellipsize && props.text.length > props.ellipsize ? (
    <TooltipComponent position={Position.BOTTOM} content={props.text}>
      <MenuItemContent {...props} />
    </TooltipComponent>
  ) : (
    <MenuItemContent {...props} />
  );
}

function MenuItemContent(props: MenuItemProps) {
  return (
    <ItemRow
      href={props.href}
      onClick={props.onSelect}
      disabled={props.disabled}
      data-cy={props.cypressSelector}
    >
      <IconContainer>
        {props.icon ? <Icon name={props.icon} size={IconSize.LARGE} /> : null}
        {props.text ? (
          <Text type={TextType.H5} weight={FontWeight.NORMAL}>
            {props.ellipsize
              ? ellipsize(props.ellipsize, props.text)
              : props.text}
          </Text>
        ) : null}
      </IconContainer>
      {props.label ? props.label : null}
    </ItemRow>
  );
}

function ellipsize(length: number, text: string) {
  return text.length > length ? text.slice(0, length).concat(" ...") : text;
}

export default MenuItem;
