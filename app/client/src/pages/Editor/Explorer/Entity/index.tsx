import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { Classes } from "@blueprintjs/core";
import { noop } from "lodash";
import useClick from "utils/hooks/useClick";

export enum EntityClassNames {
  CONTEXT_MENU = "entity-context-menu",
  ADD_BUTTON = "t--entity-add-btn",
  NAME = "t--entity-name",
  COLLAPSE_TOGGLE = "t--entity-collapse-toggle",
  WRAPPER = "t--entity",
  PROPERTY = "t--entity-property",
}

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${props => props.theme.lineHeights[2]}px;
`;

export const EntityItem = styled.div<{
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
  &&&& .${EntityClassNames.CONTEXT_MENU} {
    display: block;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: hidden;
  }
  &&&&:hover .${EntityClassNames.CONTEXT_MENU} {
    visibility: visible;
  }
`;

export type EntityProps = {
  entityId: string;
  className?: string;
  name: string;
  children?: ReactNode;
  icon: ReactNode;
  disabled?: boolean;
  action?: () => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  onCreate?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: () => void;
};

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const [isOpen, open] = useState(
      !props.disabled && !!props.isDefaultExpanded,
    );
    const isUpdating = useEntityUpdateState(props.entityId);
    const isEditing = useEntityEditState(props.entityId);

    useEffect(() => {
      // If the default state must be expanded, expand to show children
      if (props.isDefaultExpanded) {
        open(true);
      }
      if (!props.searchKeyword && !props.isDefaultExpanded) {
        open(false);
      }
    }, [props.isDefaultExpanded, open, props.searchKeyword]);

    const toggleChildren = () => {
      // Make sure this entity is enabled before toggling the collpse of children.
      !props.disabled && open(!isOpen);
      if (props.runActionOnExpand && !isOpen) {
        props.action && props.action();
      }

      if (props.onToggle && !isOpen) {
        props.onToggle();
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

    const itemRef = useRef<HTMLDivElement | null>(null);
    useClick(itemRef, handleClick, noop);

    return (
      <Wrapper
        active={!!props.active}
        className={`${EntityClassNames.WRAPPER} ${props.className}`}
        ref={ref}
      >
        <EntityItem
          active={!!props.active}
          step={props.step}
          spaced={!!props.children}
        >
          <CollapseToggle
            isOpen={isOpen}
            isVisible={!!props.children}
            onClick={toggleChildren}
            disabled={!!props.disabled}
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
          />
          {props.icon}
          <EntityName
            entityId={props.entityId}
            className={`${EntityClassNames.NAME}`}
            ref={itemRef}
            name={props.name}
            nameTransformFn={props.onNameEdit}
            isEditing={!!props.updateEntityName && isEditing}
            updateEntityName={updateNameCallback}
            searchKeyword={props.searchKeyword}
          />
          <AddButton
            onClick={props.onCreate}
            className={`${EntityClassNames.ADD_BUTTON}`}
          />
          {props.contextMenu}
          <Loader isVisible={isUpdating} />
        </EntityItem>
        <Collapse step={props.step} isOpen={isOpen} active={props.active}>
          {props.children}
        </Collapse>
      </Wrapper>
    );
  },
);

Entity.displayName = "Entity";

export default Entity;
