import React, { ReactNode, useState } from "react";
import { Icon, Collapse, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
const Wrapper = styled.div<{ active: boolean }>`
  background: ${props => (props.active ? Colors.SHARK : "none")};
`;
const EntityItem = styled.div<{ disabled: boolean }>`
  height: 30px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: ${props => props.theme.lineHeights[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[3]}px;
  border-radius: none;
  color: ${props => (props.disabled ? Colors.SLATE_GRAY : Colors.WHITE)};

  &:hover {
    background: ${Colors.MAKO};
    .${Classes.ICON} {
      color: ${props => (props.disabled ? Colors.MAKO : Colors.WHITE)};
    }
  }
  & {
    .${Classes.ICON} {
      margin-right: ${props => props.theme.spaces[2]}px;
      color: ${props =>
        props.disabled ? props.theme.colors.paneBG : Colors.WHITE};
    }
  }
  cursor: pointer;
  & > div {
    margin-right: ${props => props.theme.spaces[3]}px;
    & > svg path {
      fill: ${props => (props.disabled ? Colors.SLATE_GRAY : Colors.WHITE)};
    }
  }
`;
const StyledCollapse = styled(Collapse)`
  & {
    .${Classes.COLLAPSE_BODY} > div {
      padding-left: 16px;
    }
  }
`;

const EntityName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export type EntityProps = {
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  step: number;
  disabled?: boolean;
  action: () => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
};

export const Entity = (props: EntityProps) => {
  const [isOpen, open] = useState(!!props.isDefaultExpanded);
  const handleClick = () => {
    (props.disabled === undefined || !props.disabled) && open(!isOpen);
  };
  const collapseIcon = isOpen ? (
    <Icon icon="caret-down" />
  ) : (
    <Icon icon="caret-right" />
  );
  return (
    <Wrapper active={!!props.active}>
      <EntityItem
        onClick={handleClick}
        onDoubleClick={props.action}
        disabled={!!props.disabled}
      >
        {props.children && collapseIcon}
        {props.icon} <EntityName>{props.name}</EntityName>
      </EntityItem>
      {props.children && (
        <StyledCollapse isOpen={isOpen}>
          <div>{props.children}</div>
        </StyledCollapse>
      )}
    </Wrapper>
  );
};

export default Entity;
