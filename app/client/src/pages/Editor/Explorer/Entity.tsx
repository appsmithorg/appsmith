import React, { ReactNode, useState, useEffect } from "react";
import { Icon, Collapse, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
const Wrapper = styled.div<{ active: boolean }>`
  background: ${props => (props.active ? Colors.SHARK : "none")};
  padding: ${props => props.theme.spaces[1]}px;
`;
const EntityItem = styled.div<{ disabled: boolean }>`
  height: 30px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  line-height: ${props => props.theme.lineHeights[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[1]}px;
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
      padding-left: 8px;
      overflow: hidden;
      &:before {
        content: "";
        width: 1px;
        left: 10px;
        top: 0;
        bottom: 0;
        background: ${Colors.MAKO};
        position: absolute;
      }
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
  const [isOpen, open] = useState(!props.disabled && !!props.isDefaultExpanded);
  useEffect(() => {
    if (props.isDefaultExpanded && !props.disabled) {
      open(true);
    } else if (props.disabled) {
      open(false);
    }
  }, [props.disabled, props.isDefaultExpanded, open]);
  const handleClick = () => {
    props.action();
    !props.disabled && open(!isOpen);
  };
  const collapseIcon = isOpen ? (
    <Icon icon="caret-down" />
  ) : (
    <Icon icon="caret-right" />
  );
  return (
    <Wrapper active={!!props.active}>
      <EntityItem onClick={handleClick} disabled={!!props.disabled}>
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
