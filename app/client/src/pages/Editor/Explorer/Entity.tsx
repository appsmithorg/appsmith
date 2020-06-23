import React, { ReactNode, useState, useEffect } from "react";
import { Icon, Collapse, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
const Wrapper = styled.div<{ active: boolean }>`
  background: ${props => (props.active ? Colors.SHARK : "none")};
  padding: ${props => props.theme.spaces[1]}px;
`;
const EntityItem = styled.div<{ disabled: boolean }>`
  position: relative;
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
    .${Classes.ICON}:first-of-type {
      margin-right: ${props => props.theme.spaces[2]}px;
      color: ${props =>
        props.disabled ? props.theme.colors.paneBG : Colors.WHITE};
    }
    .${Classes.ICON}.add {
      position: absolute;
      right: 10px;
      top: 7px;
      z-index: 2;
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
  createFn?: () => void;
};

export const Entity = (props: EntityProps) => {
  const [isOpen, open] = useState(!props.disabled && !!props.isDefaultExpanded);

  useEffect(() => {
    // If the default state must be expanded, expand to show children
    if (props.isDefaultExpanded && !props.disabled) {
      open(true);
      // Else if entry is disabled, don't expand.
    } else if (props.disabled) {
      open(false);
    }
  }, [props.disabled, props.isDefaultExpanded, open]);

  // Perform the action trigger provided on click of entity
  const handleClick = () => {
    props.action();
    // Make sure this entity is enabled before toggling the collpse of children.
    !props.disabled && open(!isOpen);
  };

  // Rendering the collapse icon based on isOpen state
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
        {props.createFn && (
          <Icon
            icon="add"
            className="add"
            onClick={(e: any) => {
              props.createFn && props.createFn();
              e.stopPropagation();
            }}
          />
        )}
      </EntityItem>
      {props.children && (
        <StyledCollapse isOpen={isOpen} keepChildrenMounted>
          <div>{props.children}</div>
        </StyledCollapse>
      )}
    </Wrapper>
  );
};

export default Entity;
