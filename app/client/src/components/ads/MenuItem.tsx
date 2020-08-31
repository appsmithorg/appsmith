import React, { ReactNode } from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Text, { TextType } from "./Text";

type MenuItemProps = CommonComponentProps & {
  icon?: IconName;
  text: string;
  label?: ReactNode;
  href?: string;
  onSelect?: () => void;
};

const ItemRow = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  &:hover {
    text-decoration: none;
    cursor: pointer;
    background-color: ${props => props.theme.colors.blackShades[4]};
    span {
      color: ${props => props.theme.colors.blackShades[9]};
    }
    .ads-icon {
      path {
        fill: ${props => props.theme.colors.blackShades[9]};
      }
    }
  }
`;

const IconContainer = styled.span`
  display: flex;
  align-items: center;

  .ads-icon {
    margin-right: ${props => props.theme.spaces[5]}px;
  }
`;

function MenuItem(props: MenuItemProps) {
  return (
    <ItemRow href={props.href} onClick={props.onSelect}>
      <IconContainer>
        {props.icon ? <Icon name={props.icon} size={IconSize.LARGE} /> : null}
        {props.text ? <Text type={TextType.P1}>{props.text}</Text> : null}
      </IconContainer>
      {props.label ? <Text type={TextType.P1}>{props.label}</Text> : null}
    </ItemRow>
  );
}

export default MenuItem;
