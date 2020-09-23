import React, { ReactNode } from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Text, { TextType, FontWeight } from "./Text";

export type MenuItemProps = CommonComponentProps & {
  icon?: IconName;
  text: string;
  label?: ReactNode;
  href?: string;
  onSelect?: () => void;
};

const ItemRow = styled.a<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0px ${props => props.theme.spaces[6]}px;
  height: 38px;

  ${props =>
    !props.disabled
      ? ` 
    &:hover {
      cursor: pointer;
      text-decoration: none;
      background-color: ${props.theme.colors.blackShades[4]};
      .${Classes.TEXT} {
        color: ${props.theme.colors.blackShades[9]};
      }
      .${Classes.ICON} {
        path {
          fill: ${props.theme.colors.blackShades[9]};
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
            {props.text}
          </Text>
        ) : null}
      </IconContainer>
      {props.label ? props.label : null}
    </ItemRow>
  );
}

export default MenuItem;
