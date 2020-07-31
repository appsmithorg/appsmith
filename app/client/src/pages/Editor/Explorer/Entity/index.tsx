import React, { ReactNode, useState, useEffect, memo } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { Classes } from "@blueprintjs/core";

export enum EntityClassNames {
  ACTION_CONTEXT_MENU = "action-entity",
}

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${props => props.theme.lineHeights[2]}px;
`;

const EntityItem = styled.div<{
  active: boolean;
  step: number;
  spaced: boolean;
}>`
  position: relative;
  font-size: 12px;
  padding-left: ${props => props.step * props.theme.spaces[2]}px;
  background: ${props => (props.active ? Colors.TUNDORA : "none")};
  height: 30px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: ${props =>
    props.spaced ? "20px auto 1fr 30px" : "8px auto 1fr 30px"};
  border-radius: 0;
  color: ${props => (props.active ? Colors.WHITE : Colors.ALTO)};
  cursor: pointer;
  align-items: center;
  &:hover {
    background: ${Colors.TUNDORA};
  }
  & .${Classes.POPOVER_TARGET}, & .${Classes.POPOVER_WRAPPER} {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &&&& .${EntityClassNames.ACTION_CONTEXT_MENU} {
    display: block;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
  }
  &&&&:hover .${EntityClassNames.ACTION_CONTEXT_MENU} {
    visibility: visible;
  }
`;

export type EntityProps = {
  entityId: string;
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  action?: () => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  createFn?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
};

/* eslint-disable react/display-name */
export const Entity = memo((props: EntityProps) => {
  const [isOpen, open] = useState(!props.disabled && !!props.isDefaultExpanded);
  const isUpdating = useEntityUpdateState(props.entityId);
  const isEditing = useEntityEditState(props.entityId);

  useEffect(() => {
    // If the default state must be expanded, expand to show children
    if (props.isDefaultExpanded) {
      open(true);
    }
  }, [props.isDefaultExpanded, open]);

  const toggleChildren = () => {
    // Make sure this entity is enabled before toggling the collpse of children.
    !props.disabled && open(!isOpen);
    if (props.runActionOnExpand && !isOpen) {
      props.action && props.action();
    }
  };

  const updateNameCallback = (name: string) => {
    return (
      props.updateEntityName && props.updateEntityName(props.entityId, name)
    );
  };

  const handleClick = () => {
    if (props.action) props.action();
    else toggleChildren();
  };

  return (
    <Wrapper active={!!props.active}>
      <EntityItem
        active={!!props.active}
        onClick={handleClick}
        step={props.step}
        spaced={!!props.children}
      >
        <CollapseToggle
          isOpen={isOpen}
          isVisible={!!props.children}
          onClick={toggleChildren}
          disabled={!!props.disabled}
        />
        {props.icon}
        <EntityName
          entityId={props.entityId}
          name={props.name}
          isEditing={!!props.updateEntityName && isEditing}
          updateEntityName={updateNameCallback}
          searchKeyword={props.searchKeyword}
        />
        <AddButton onClick={props.createFn} />
        {props.contextMenu}
        <Loader isVisible={isUpdating} />
      </EntityItem>
      <Collapse step={props.step} isOpen={isOpen} active={props.active}>
        {props.children}
      </Collapse>
    </Wrapper>
  );
});

export default Entity;
