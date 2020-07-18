import React, { ReactNode, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { useDispatch } from "react-redux";

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
  padding-left: ${props => props.step * props.theme.spaces[2]}px;
  background: ${props => (props.active ? Colors.SHARK : "none")};
  height: 30px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: ${props =>
    props.spaced ? "20px auto 1fr 20px" : "8px auto 1fr 20px"};
  border-radius: 0;
  color: ${Colors.WHITE};
  cursor: pointer;
  align-items: center;
  &:hover {
    background: ${Colors.MAKO};
  }
`;

export type EntityProps = {
  entityId: string;
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  action: () => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  createFn?: () => void;
  contextMenu?: ReactNode;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  dispatchableAction?: boolean;
};

export const Entity = (props: EntityProps) => {
  const [isOpen, open] = useState(!props.disabled && !!props.isDefaultExpanded);
  const dispatch = useDispatch();
  const isUpdating = useEntityUpdateState(props.entityId);
  const isEditing = useEntityEditState(props.entityId);

  useEffect(() => {
    // If the default state must be expanded, expand to show children
    if (props.isDefaultExpanded && !props.disabled) {
      open(true);
      // Else if entry is disabled, don't expand.
    } else if (props.disabled) {
      open(false);
    }
  }, [props.disabled, props.isDefaultExpanded, open]);

  const toggleChildren = () => {
    // Make sure this entity is enabled before toggling the collpse of children.
    !props.disabled && open(!isOpen);
  };

  const updateNameCallback = (name: string) => {
    return (
      props.updateEntityName && props.updateEntityName(props.entityId, name)
    );
  };
  const { dispatchableAction, action } = props;
  const handleEntityClick = useCallback(() => {
    if (dispatchableAction) {
      dispatch(action());
    } else {
      action();
    }
  }, [dispatchableAction, action, dispatch]);

  return (
    <Wrapper active={!!props.active}>
      <EntityItem
        active={!!props.active}
        onClick={handleEntityClick}
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
          name={props.name}
          isEditing={!!props.updateEntityName && isEditing}
          updateEntityName={updateNameCallback}
        />
        <AddButton onClick={props.createFn} />
        {props.contextMenu}
        <Loader isVisible={isUpdating} />
      </EntityItem>
      <Collapse step={props.step} isOpen={isOpen}>
        {props.children}
      </Collapse>
    </Wrapper>
  );
};

export default Entity;
