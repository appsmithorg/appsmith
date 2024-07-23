import type { ReactNode, RefObject } from "react";
import React, { useEffect, forwardRef, useCallback } from "react";
import styled, { css } from "styled-components";
import { useEventCallback } from "usehooks-ts";

import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import {
  useEntityUpdateState,
  useEntityEditState,
} from "@appsmith/pages/Editor/Explorer/hooks";
import { Classes } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getEntityCollapsibleState } from "selectors/editorContextSelectors";
import type { AppState } from "@appsmith/reducers";
import { setEntityCollapsibleState } from "actions/editorContextActions";
import { Tooltip, Tag, Spinner } from "design-system";
import {
  createMessage,
  EXPLORER_BETA_ENTITY,
} from "@appsmith/constants/messages";
import classNames from "classnames";

export enum EntityClassNames {
  CONTEXT_MENU = "entity-context-menu",
  CONTEXT_MENU_CONTENT = "entity-context-menu-content",
  RIGHT_ICON = "entity-right-icon",
  PRE_RIGHT_ICON = "entity-pre-right-icon",
  ICON = "entity-icon",
  ADD_BUTTON = "t--entity-add-btn",
  NAME = "t--entity-name",
  COLLAPSE_TOGGLE = "t--entity-collapse-toggle",
  WRAPPER = "t--entity",
  PROPERTY = "t--entity-property",
  TOOLTIP = "t--entity-tooltp",
}

export const ContextMenuWrapper = styled.div`
  height: 100%;
`;

const Wrapper = styled.div<{ active: boolean }>`
  line-height: ${({ theme }) => theme.lineHeights[2]}px;
  ${ContextMenuWrapper} {
    width: 0;
  }
  &: hover {
    & > div > ${ContextMenuWrapper} {
      min-width: 30px;
      width: auto;
    }
  }

  &&&.datasourceStructure-query-editor
    .t--entity-item.active
    .${EntityClassNames.CONTEXT_MENU} {
    visibility: visible;
  }

  &.datasourceStructure-query-editor
    .t--entity-item.active
    ${ContextMenuWrapper} {
    min-width: 30px;
    width: auto;
  }

  &.group {
    font-weight: 500;
  }
  font-weight: 400;
`;

export const entityTooltipCSS = css`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const EntityItem = styled.div<{
  active: boolean;
  step: number;
  disabled?: boolean;
  spaced: boolean;
  highlight: boolean;
  isSticky: boolean;
  rightIconClickable?: boolean;
  alwaysShowRightIcon?: boolean;
}>`
  position: ${({ isSticky }) => (isSticky ? "sticky" : "relative")};
  ${({ isSticky }) =>
    isSticky &&
    css`
      top: 0;
      z-index: 100;
    `}
  font-size: 14px;
  user-select: none;
  padding-left: ${({ step }) => `calc(0.25rem + (0.25 * ${step}rem))`};
  background: ${({ active, isSticky }) =>
    active
      ? `var(--ads-v2-color-bg-muted)`
      : isSticky
        ? "var(--ads-v2-color-bg)"
        : "none"};
  height: 36px;
  width: 100%;
  display: inline-grid;
  grid-template-columns: 20px auto 1fr auto auto auto auto auto;
  grid-auto-flow: column dense;
  border-radius: var(--ads-v2-border-radius);
  color: var(--ads-v2-color-fg);
  cursor: pointer;
  align-items: center;
  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }

  ${({ disabled }) =>
    disabled &&
    `
    color: var(--ads-v2-color-fg-subtle);
    &:hover {
      background: transparent;
    }
    .${EntityClassNames.ICON} .ads-v2-icon {
      color: var(--ads-v2-color-fg-subtle);
    }
  `}

  scroll-margin-top: 36px;
  scroll-snap-margin-top: 36px;

  & .${EntityClassNames.TOOLTIP} {
    ${entityTooltipCSS}
    .${Classes.POPOVER_TARGET} {
      ${entityTooltipCSS}
    }
  }

  .file-ops {
    height: 36px;
  }

  & .${EntityClassNames.COLLAPSE_TOGGLE} {
    svg {
      path {
        fill: var(--ads-v2-color-fg);
      }
    }
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
    visibility: ${({ alwaysShowRightIcon }) =>
      alwaysShowRightIcon ? "visible" : "hidden"};
    height: 100%;
    width: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  & .${EntityClassNames.RIGHT_ICON}:hover {
    background: ${({ rightIconClickable }) =>
      rightIconClickable
        ? "var(--ads-v2-color-bg-brand-secondary-emphasis)"
        : "initial"};
    svg {
      path {
        fill: ${({ rightIconClickable }) =>
          rightIconClickable ? Colors.WHITE : "initial"};
      }
    }
  }

  & .${EntityClassNames.RIGHT_ICON} svg {
    cursor: ${({ rightIconClickable }) =>
      rightIconClickable ? "pointer" : "initial"};
  }

  &:hover .${EntityClassNames.RIGHT_ICON} {
    visibility: visible;
  }
`;

const IconWrapper = styled.span`
  line-height: ${({ theme }) => theme.lineHeights[0]}px;
  color: var(--ads-v2-color-fg);
  display: flex;
  align-items: center;

  div {
    cursor: pointer;
  }

  svg {
    width: 16px;
    height: 16px;
  }
  margin-right: 4px;
`;

export const AddButtonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const SubItemWrapper = styled.div`
  margin-right: 4px;
`;

export interface EntityProps {
  action?: (e: any) => void;
  active?: boolean;
  addButtonHelpText?: string;
  alwaysShowRightIcon?: boolean;
  canEditEntityName?: boolean;
  children?: ReactNode;
  className?: string;
  collapseRef?: RefObject<HTMLDivElement> | null;
  contextMenu?: ReactNode;
  customAddButton?: ReactNode;
  disabled?: boolean;
  entityId: string;
  forceExpand?: boolean;
  highlight?: boolean;
  icon: ReactNode;
  isBeta?: boolean;
  isDefaultExpanded?: boolean;
  isSticky?: boolean;
  name: string;
  onClickPreRightIcon?: () => void;
  onClickRightIcon?: () => void;
  onCreate?: () => void;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: (isOpen: boolean) => void;
  preRightIcon?: ReactNode;
  rightIcon?: ReactNode;
  runActionOnExpand?: boolean;
  searchKeyword?: string;
  showAddButton?: boolean;
  step: number;
  updateEntityName?: (id: string, name: string) => any;
}

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const {
      action,
      active,
      addButtonHelpText,
      alwaysShowRightIcon,
      canEditEntityName = false,
      children,
      className,
      collapseRef,
      contextMenu,
      customAddButton,
      disabled,
      entityId,
      forceExpand,
      highlight,
      icon,
      isBeta,
      isDefaultExpanded,
      isSticky,
      name,
      onClickPreRightIcon,
      onClickRightIcon,
      onCreate,
      onNameEdit,
      onToggle,
      preRightIcon,
      rightIcon,
      runActionOnExpand,
      searchKeyword,
      showAddButton = false,
      step,
      updateEntityName,
    } = props;

    const isEntityOpen = useSelector((state: AppState) =>
      getEntityCollapsibleState(state, entityId),
    );

    const isUpdating = useEntityUpdateState(entityId);
    const isEditing = useEntityEditState(entityId);
    const dispatch = useDispatch();

    const isOpen =
      (isEntityOpen === undefined ? isDefaultExpanded : isEntityOpen) ||
      !!searchKeyword;

    const open = useEventCallback((shouldOpen: boolean | undefined) => {
      if (children && name && isOpen !== shouldOpen) {
        dispatch(setEntityCollapsibleState(entityId, Boolean(shouldOpen)));
      }
    });

    useEffect(() => {
      if (isEntityOpen !== undefined) open(isOpen);
    }, [isEntityOpen, isOpen, name, open]);

    useEffect(() => {
      if (!!forceExpand) open(true);
    }, [forceExpand, open]);

    const toggleChildren = (e: any) => {
      onToggle && onToggle(!isOpen);
      // Make sure this entity is enabled before toggling the collpse of children.
      !disabled && open(!isOpen);
      if (runActionOnExpand && !isOpen) {
        action && action(e);
      }
    };

    const updateNameCallback = useCallback(
      (name: string) => {
        return updateEntityName && updateEntityName(entityId, name);
      },
      [entityId, updateEntityName],
    );

    const handleClick = (e: React.MouseEvent) => {
      if (action) action(e);
      else toggleChildren(e);
    };

    const exitEditMode = useCallback(() => {
      dispatch({
        type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
      });
    }, [dispatch]);

    const enterEditMode = useCallback(() => {
      if (!canEditEntityName) return;
      updateEntityName &&
        dispatch({
          type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
          payload: {
            id: entityId,
          },
        });
    }, [canEditEntityName, dispatch, entityId, updateEntityName]);

    const addButton = customAddButton || (
      <Tooltip
        content={addButtonHelpText || ""}
        isDisabled={!addButtonHelpText}
        placement="right"
      >
        <AddButtonWrapper id={`add_${entityId}`}>
          <AddButton
            className={`${EntityClassNames.ADD_BUTTON} ${className}`}
            onClick={onCreate}
          />
        </AddButtonWrapper>
      </Tooltip>
    );

    return (
      <Wrapper
        active={!!active}
        className={`${EntityClassNames.WRAPPER} ${className}`}
        ref={ref}
      >
        <EntityItem
          active={!!active}
          alwaysShowRightIcon={alwaysShowRightIcon}
          className={classNames({
            highlighted: highlight,
            active: active,
            editable: canEditEntityName,
            "t--entity-item": true,
          })}
          data-guided-tour-id={`explorer-entity-${name}`}
          data-guided-tour-iid={name}
          data-testid={`t--entity-item-${name}`}
          disabled={!!disabled}
          highlight={!!highlight}
          id={"entity-" + entityId}
          isSticky={isSticky === true}
          rightIconClickable={typeof onClickRightIcon === "function"}
          spaced={!!children}
          step={step}
        >
          <CollapseToggle
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
            disabled={!!disabled}
            isOpen={!!isOpen}
            isVisible={!!children}
            onClick={toggleChildren}
          />
          <IconWrapper
            className={`${EntityClassNames.ICON}`}
            onClick={handleClick}
          >
            {icon}
          </IconWrapper>
          <EntityName
            className={`${EntityClassNames.NAME}`}
            enterEditMode={enterEditMode}
            entityId={entityId}
            exitEditMode={exitEditMode}
            isBeta={isBeta}
            isEditing={!!updateEntityName && isEditing}
            name={name}
            nameTransformFn={onNameEdit}
            onClick={handleClick}
            searchKeyword={searchKeyword}
            updateEntityName={updateNameCallback}
          />
          {isUpdating && (
            <SubItemWrapper>
              <Spinner />
            </SubItemWrapper>
          )}
          {isBeta && (
            <SubItemWrapper>
              <Tag isClosable={false}>
                {createMessage(EXPLORER_BETA_ENTITY)}
              </Tag>
            </SubItemWrapper>
          )}
          {preRightIcon && (
            <IconWrapper
              className={`${EntityClassNames.PRE_RIGHT_ICON} w-full h-full`}
              onClick={onClickPreRightIcon}
            >
              {preRightIcon}
            </IconWrapper>
          )}
          {rightIcon && (
            <IconWrapper
              className={EntityClassNames.RIGHT_ICON}
              onClick={onClickRightIcon}
            >
              {rightIcon}
            </IconWrapper>
          )}
          {showAddButton && addButton}
          {contextMenu && (
            <ContextMenuWrapper>{contextMenu}</ContextMenuWrapper>
          )}
        </EntityItem>
        <Collapse
          active={active}
          collapseRef={collapseRef}
          isOpen={!!isOpen}
          step={step}
        >
          {children}
        </Collapse>
      </Wrapper>
    );
  },
);

Entity.displayName = "Entity";

export default Entity;
