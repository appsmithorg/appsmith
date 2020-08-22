import React, { ReactNode } from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { Icon, IconName } from "./Icon";
import Text, { TextType } from "./Text";
import { Size } from "./Button";

type MenuItemProps = CommonComponentProps & {
  icon?: IconName;
  text: string;
  label?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
};

const ItemDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0px;
`;

const LeftBlock = styled.div`
  display: flex;
  align-items: center;

  .ads-icon {
    margin-right: 12px;
  }
`;

function MenuItem(props: MenuItemProps) {
  return (
    <ItemDiv onClick={props.onSelect}>
      <LeftBlock>
        {props.icon ? <Icon name={props.icon} size={Size.large} /> : null}
        {props.text ? <Text type={TextType.P1}>{props.text}</Text> : null}
      </LeftBlock>
      {props.label ? <Text type={TextType.P1}>{props.label}</Text> : null}
    </ItemDiv>
  );
}

export default MenuItem;
