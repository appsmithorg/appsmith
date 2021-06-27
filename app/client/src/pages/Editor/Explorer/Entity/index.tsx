import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
} from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName, { EntityNameProps } from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import { useEntityUpdateState, useEntityEditState } from "../hooks";
import Loader from "./Loader";
import { Classes } from "@blueprintjs/core";
import { noop } from "lodash";
import useClick from "utils/hooks/useClick";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { isEllipsisActive } from "utils/helpers";

export enum EntityClassNames {
  CONTEXT_MENU = "entity-context-menu",
  RIGHT_ICON = "entity-right-icon",
  ADD_BUTTON = "t--entity-add-btn",
  NAME = "t--entity-name",
  COLLAPSE_TOGGLE = "t--entity-collapse-toggle",
  WRAPPER = "t--entity",
  PROPERTY = "t--entity-property",
}

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${(props) => props.theme.lineHeights[2]}px;
`;

export const EntityItem = styled.div<{
  active: boolean;
  step: number;
  spaced: boolean;
  highlight: boolean;
}>`
  position: relative;
  border-top: ${(props) => (props.highlight ? "1px solid #e7e7e7" : "none")};
  border-bottom: ${(props) => (props.highlight ? "1px solid #e7e7e7" : "none")};
  font-size: 12px;
  user-select: none;
  padding-left: ${(props) =>
    props.step * props.theme.spaces[2] + props.theme.spaces[2]}px;
  background: ${(props) => (props.active ? Colors.TUNDORA : "none")};
  height: 30px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: ${(props) =>
    props.spaced ? "20px auto 1fr auto 30px" : "8px auto 1fr auto 30px"};
  border-radius: 0;
  color: ${(props) => (props.active ? Colors.WHITE : Colors.ALTO)};
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

    overflow: hidden;
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

  & .${EntityClassNames.RIGHT_ICON} {
    visibility: hidden;
    padding-right: ${(props) => props.theme.spaces[2]}px;
  }
  &:hover .${EntityClassNames.RIGHT_ICON} {
    visibility: visible;
  }
`;

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
`;

export type EntityProps = {
  entityId: string;
  className?: string;
  name: string;
  children?: ReactNode;
  highlight?: boolean;
  icon: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  action?: (e: any) => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  onCreate?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: (isOpen: boolean) => void;
};

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const [isOpen, open] = useState(!!props.isDefaultExpanded);
    const isUpdating = useEntityUpdateState(props.entityId);
    const isEditing = useEntityEditState(props.entityId);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (props.isDefaultExpanded) {
        open(true);
        props.onToggle && props.onToggle(true);
      }
    }, [props.isDefaultExpanded]);
    useEffect(() => {
      if (!props.searchKeyword && !props.isDefaultExpanded) {
        open(false);
      }
    }, [props.searchKeyword]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const toggleChildren = (e: any) => {
      // Make sure this entity is enabled before toggling the collpse of children.
      !props.disabled && open(!isOpen);
      if (props.runActionOnExpand && !isOpen) {
        props.action && props.action(e);
      }

      if (props.onToggle) {
        props.onToggle(!isOpen);
      }
    };

    const handleClick = (e: any) => {
      if (props.action) props.action(e);
      else toggleChildren(e);
    };

    return (
      <Wrapper
        active={!!props.active}
        className={`${EntityClassNames.WRAPPER} ${props.className}`}
        ref={ref}
      >
        <EntityItem
          active={!!props.active}
          className={`${props.highlight ? "highlighted" : ""} ${
            props.active ? "active" : ""
          }`}
          highlight={!!props.highlight}
          spaced={!!props.children}
          step={props.step}
        >
          <CollapseToggle
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
            disabled={!!props.disabled}
            isOpen={isOpen}
            isVisible={!!props.children}
            onClick={toggleChildren}
          />
          <IconWrapper onClick={handleClick}>{props.icon}</IconWrapper>
          <EntityNameWithTooltip
            {...props}
            isEditing={isEditing}
            onClick={handleClick}
            onNameEdit={props.onNameEdit}
            updateEntityName={props.updateEntityName}
          />
          <IconWrapper className={EntityClassNames.RIGHT_ICON}>
            {props.rightIcon}
          </IconWrapper>
          <AddButton
            className={`${EntityClassNames.ADD_BUTTON}`}
            onClick={props.onCreate}
          />
          {props.contextMenu}
          <Loader isVisible={isUpdating} />
        </EntityItem>
        <Collapse active={props.active} isOpen={isOpen} step={props.step}>
          {props.children}
        </Collapse>
      </Wrapper>
    );
  },
);

interface HoverableEntityNameProps {
  isEditing: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  updateEntityName?: (id: string, name: string) => any;
  onClick: (e: any) => void;
}

const EntityNameWithTooltip = React.memo(function(
  props: Omit<EntityNameProps, "updateEntityName"> & HoverableEntityNameProps,
): JSX.Element {
  const updateNameCallback = useCallback(
    (name: string) =>
      props.updateEntityName && props.updateEntityName(props.entityId, name),
    [],
  );
  const entityRef = useRef<HTMLDivElement>(null);
  useClick(entityRef, props.onClick, noop);
  const entityName = (
    <EntityName
      entityId={props.entityId}
      isEditing={!!props.updateEntityName && props.isEditing}
      name={props.name}
      nameTransformFn={props.onNameEdit}
      ref={entityRef}
      searchKeyword={props.searchKeyword}
      updateEntityName={updateNameCallback}
    />
  );

  return isEllipsisActive(entityRef?.current) ? (
    <TooltipComponent content={props.name} position={Position.LEFT}>
      {entityName}
    </TooltipComponent>
  ) : (
    entityName
  );
});

EntityNameWithTooltip.displayName = "EntityNameWithTooltip";

Entity.displayName = "Entity";

export default Entity;
