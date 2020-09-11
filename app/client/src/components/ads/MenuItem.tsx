import React, { ReactNode } from "react";
import { CommonComponentProps, Classes } from "./common";
import styled from "styled-components";
import Icon, { IconName, IconSize } from "./Icon";
import Text, { TextType, FontWeight } from "./Text";

type MenuItemProps = CommonComponentProps & {
  icon?: IconName;
  text: string;
  label?: ReactNode;
  onSelect?: () => void;
};

const ItemRow = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;

  ${props =>
    !props.disabled
      ? ` 
    &:hover {
      cursor: pointer;
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
      cursor: not-allowed;
    }
    `}
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;

  .${Classes.ICON} {
    margin-right: ${props => props.theme.spaces[5]}px;
  }
`;

function MenuItem(props: MenuItemProps) {
  return (
    <ItemRow
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
      {props.label ? <Text type={TextType.P1}>{props.label}</Text> : null}
    </ItemRow>
  );
}

export default MenuItem;
