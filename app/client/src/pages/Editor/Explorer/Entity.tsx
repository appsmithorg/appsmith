import React, { ReactNode, useState, useEffect } from "react";
import { Icon, Collapse, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { CreateIcon } from "./ExplorerStyledComponents";
enum EntityActionKind {
  SINGLE_CLICK,
  DOUBLE_CLICK,
}

export enum EntityClassNames {
  ACTION_CONTEXT_MENU = "action-entity",
}

const Wrapper = styled.div`
  margin: ${props => props.theme.spaces[1]}px 0
    ${props => props.theme.spaces[1]}px ${props => props.theme.spaces[1]}px;
`;
const EntityItem = styled.div<{ disabled: boolean; active: boolean }>`
  background: ${props => (props.active ? Colors.SHARK : "none")};

  position: relative;
  height: 30px;
  font-size: ${props => props.theme.fontSizes[2]}px;
  line-height: ${props => props.theme.lineHeights[2]}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: ${props => props.theme.spaces[1]}px 0px;
  border-radius: 0;
  color: ${props => (props.disabled ? Colors.SLATE_GRAY : Colors.WHITE)};
  .${EntityClassNames.ACTION_CONTEXT_MENU} {
    position: absolute;
    right: 5px;
    z-index: 2;
    svg {
      margin-left: 2px;
    }
  }
  &:hover {
    .${Classes.ICON} {
      color: ${props => (props.disabled ? Colors.MAKO : Colors.WHITE)};
    }
  }
  & {
    .${Classes.ICON}:first-of-type {
      color: ${props =>
        props.disabled ? props.theme.colors.paneBG : Colors.SLATE_GRAY};
      &:hover {
        color: ${props =>
          props.disabled ? props.theme.colors.paneBG : Colors.WHITE};
      }
    }
    .add {
      position: absolute;
      right: 5px;
      top: 7px;
      z-index: 2;
      margin-right: 0;
    }
  }
  cursor: pointer;
  & > div {
    margin-right: ${props => props.theme.spaces[3]}px;
  }
`;
const StyledCollapse = styled(Collapse)`
  & {
    .${Classes.COLLAPSE_BODY} > div {
      padding-left: 4px;
      overflow: hidden;
      &:before {
        content: "";
        width: 1px;
        background: ${Colors.TROUT};
        bottom: 10px;
        left: 7px;
        top: 10px;
        position: absolute;
      }
    }
  }
`;

const EntityName = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: calc(100% - 40px);
  & > * {
    margin-right: 4px;
  }
  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export type EntityProps = {
  name: ReactNode;
  children?: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  action: () => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  createFn?: () => void;
  actionKind?: EntityActionKind;
  contextMenu?: ReactNode;
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
    props.actionKind === EntityActionKind.SINGLE_CLICK && props.action();
    // Make sure this entity is enabled before toggling the collpse of children.
    !props.disabled && open(!isOpen);
  };

  const handleDblClick = () => {
    (!props.actionKind || props.actionKind === EntityActionKind.DOUBLE_CLICK) &&
      props.action();
  };

  // Rendering the collapse icon based on isOpen state
  const collapseIcon = isOpen ? (
    <Icon icon="caret-down" />
  ) : (
    <Icon icon="caret-right" />
  );

  // Render the "add" button if a createFn is provided
  const createIconBtn = props.createFn && (
    <CreateIcon
      className="add"
      onClick={(e: any) => {
        props.createFn && props.createFn();
        e.stopPropagation();
      }}
    />
  );

  return (
    <Wrapper>
      <EntityItem
        active={!!props.active}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
        disabled={!!props.disabled}
      >
        {props.children && collapseIcon}
        <EntityName style={{ marginLeft: !props.children ? "16px" : "0" }}>
          {props.icon}
          {props.name}
        </EntityName>
        {createIconBtn}
        {props.contextMenu}
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
