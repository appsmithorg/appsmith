import type { ReactNode, RefObject } from "react";
import React, {
  useEffect,
  useRef,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import styled, { css } from "styled-components";
import { Colors } from "constants/Colors";
import CollapseToggle from "./CollapseToggle";
import EntityName from "./Name";
import AddButton from "./AddButton";
import Collapse from "./Collapse";
import {
  useEntityUpdateState,
  useEntityEditState,
} from "ee/pages/Editor/Explorer/hooks";
import { Classes } from "@blueprintjs/core";
import { noop } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import useClick from "utils/hooks/useClick";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getEntityCollapsibleState } from "selectors/editorContextSelectors";
import type { AppState } from "ee/reducers";
import { setEntityCollapsibleState } from "actions/editorContextActions";
import { Tooltip, Tag, Spinner } from "@appsmith/ads";
import { createMessage, EXPLORER_BETA_ENTITY } from "ee/constants/messages";
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
  line-height: ${(props) => props.theme.lineHeights[2]}px;
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
  ${(props) =>
    props.isSticky &&
    css`
      top: 0;
      z-index: 100;
    `}
  font-size: 14px;
  user-select: none;
  padding-left: ${(props) => `calc(0.25rem + (0.25 * ${props.step}rem))`};
  background: ${(props) =>
    props.active
      ? `var(--ads-v2-color-bg-muted)`
      : props.isSticky
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

  ${(props) =>
    props.disabled &&
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

  & .t--entity-name {
    padding-left: var(--ads-v2-spaces-3);
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
    visibility: ${(props) =>
      props.alwaysShowRightIcon ? "visible" : "hidden"};
    height: 100%;
    width: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  & .${EntityClassNames.RIGHT_ICON}:hover {
    background: ${(props) =>
      props.rightIconClickable
        ? "var(--ads-v2-color-bg-brand-secondary-emphasis)"
        : "initial"};
    svg {
      path {
        fill: ${(props) =>
          props.rightIconClickable ? Colors.WHITE : "initial"};
      }
    }
  }

  & .${EntityClassNames.RIGHT_ICON} svg {
    cursor: ${(props) => (props.rightIconClickable ? "pointer" : "initial")};
  }

  &:hover .${EntityClassNames.RIGHT_ICON} {
    visibility: visible;
  }
`;

const IconWrapper = styled.span``;

export const AddButtonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const SubItemWrapper = styled.div`
  margin-right: 4px;
`;

export interface EntityProps {
  entityId: string;
  showAddButton?: boolean;
  className?: string;
  canEditEntityName?: boolean;
  name: string;
  children?: ReactNode;
  highlight?: boolean;
  icon: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action?: (e: any) => void;
  active?: boolean;
  isDefaultExpanded?: boolean;
  onCreate?: () => void;
  contextMenu?: ReactNode;
  searchKeyword?: string;
  step: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateEntityName?: (id: string, name: string) => any;
  runActionOnExpand?: boolean;
  onNameEdit?: (input: string, limit?: number) => string;
  onToggle?: (isOpen: boolean) => void;
  alwaysShowRightIcon?: boolean;
  onClickRightIcon?: () => void;
  addButtonHelptext?: string;
  isBeta?: boolean;
  preRightIcon?: ReactNode;
  onClickPreRightIcon?: () => void;
  isSticky?: boolean;
  collapseRef?: RefObject<HTMLDivElement> | null;
  customAddButton?: ReactNode;
  forceExpand?: boolean;
}

export const Entity = forwardRef(
  (props: EntityProps, ref: React.Ref<HTMLDivElement>) => {
    const isEntityOpen = useSelector((state: AppState) =>
      getEntityCollapsibleState(state, props.entityId),
    );
    const isDefaultExpanded = useMemo(() => !!props.isDefaultExpanded, []);
    const { canEditEntityName = false, showAddButton = false } = props;
    const isUpdating = useEntityUpdateState(props.entityId);
    const isEditing = useEntityEditState(props.entityId);
    const dispatch = useDispatch();

    const isOpen =
      (isEntityOpen === undefined ? isDefaultExpanded : isEntityOpen) ||
      !!props.searchKeyword;

    const open = (shouldOpen: boolean | undefined) => {
      if (!!props.children && props.name && isOpen !== shouldOpen) {
        dispatch(setEntityCollapsibleState(props.entityId, !!shouldOpen));
      }
    };

    useEffect(() => {
      if (isEntityOpen !== undefined) open(isOpen);
    }, [props.name]);

    useEffect(() => {
      if (!!props.forceExpand) open(true);
    }, [props.forceExpand]);

    /* eslint-enable react-hooks/exhaustive-deps */
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggleChildren = (e: any) => {
      props.onToggle && props.onToggle(!isOpen);
      // Make sure this entity is enabled before toggling the collpse of children.
      !props.disabled && open(!isOpen);

      if (props.runActionOnExpand && !isOpen) {
        props.action && props.action(e);
      }
    };

    const updateNameCallback = useCallback(
      (name: string) => {
        return (
          props.updateEntityName && props.updateEntityName(props.entityId, name)
        );
      },
      [props.entityId, props.updateEntityName],
    );

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (e: any) => {
      if (props.action) props.action(e);
      else toggleChildren(e);
    };

    const exitEditMode = useCallback(() => {
      dispatch({
        type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
      });
    }, [dispatch]);

    const enterEditMode = useCallback(() => {
      if (!canEditEntityName) return;

      props.updateEntityName &&
        dispatch({
          type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
          payload: {
            id: props.entityId,
          },
        });
    }, [dispatch, props.entityId, props.updateEntityName]);

    const itemRef = useRef<HTMLDivElement | null>(null);

    useClick(itemRef, handleClick, noop);

    const addButton = props.customAddButton || (
      <Tooltip
        content={props.addButtonHelptext || ""}
        isDisabled={!props.addButtonHelptext}
        placement="right"
      >
        <AddButtonWrapper id={`add_${props.entityId}`}>
          <AddButton
            className={`${EntityClassNames.ADD_BUTTON} ${props.className}`}
            onClick={props.onCreate}
          />
        </AddButtonWrapper>
      </Tooltip>
    );

    return (
      <Wrapper
        active={!!props.active}
        className={`${EntityClassNames.WRAPPER} ${props.className}`}
        ref={ref}
      >
        <EntityItem
          active={!!props.active}
          alwaysShowRightIcon={props.alwaysShowRightIcon}
          className={classNames({
            highlighted: props.highlight,
            active: props.active,
            editable: canEditEntityName,
            "t--entity-item": true,
          })}
          data-guided-tour-id={`explorer-entity-${props.name}`}
          data-guided-tour-iid={props.name}
          data-testid={`t--entity-item-${props.name}`}
          disabled={!!props.disabled}
          highlight={!!props.highlight}
          id={"entity-" + props.entityId}
          isSticky={props.isSticky === true}
          rightIconClickable={typeof props.onClickRightIcon === "function"}
          spaced={!!props.children}
          step={props.step}
        >
          <CollapseToggle
            className={`${EntityClassNames.COLLAPSE_TOGGLE}`}
            disabled={!!props.disabled}
            isOpen={!!isOpen}
            isVisible={!!props.children}
            onClick={toggleChildren}
          />
          <IconWrapper
            className={`${EntityClassNames.ICON}`}
            onClick={handleClick}
          >
            {props.icon}
          </IconWrapper>
          <EntityName
            className={`${EntityClassNames.NAME}`}
            enterEditMode={enterEditMode}
            entityId={props.entityId}
            exitEditMode={exitEditMode}
            isBeta={props.isBeta}
            isEditing={!!props.updateEntityName && isEditing}
            name={props.name}
            nameTransformFn={props.onNameEdit}
            ref={itemRef}
            searchKeyword={props.searchKeyword}
            updateEntityName={updateNameCallback}
          />
          {isUpdating && (
            <SubItemWrapper>
              <Spinner />
            </SubItemWrapper>
          )}
          {props.isBeta && (
            <SubItemWrapper>
              <Tag isClosable={false}>
                {createMessage(EXPLORER_BETA_ENTITY)}
              </Tag>
            </SubItemWrapper>
          )}
          {props.preRightIcon && (
            <IconWrapper
              className={`${EntityClassNames.PRE_RIGHT_ICON} w-full h-full`}
              onClick={props.onClickPreRightIcon}
            >
              {props.preRightIcon}
            </IconWrapper>
          )}
          {props.rightIcon && (
            <IconWrapper
              className={EntityClassNames.RIGHT_ICON}
              onClick={props.onClickRightIcon}
            >
              {props.rightIcon}
            </IconWrapper>
          )}
          {showAddButton && addButton}
          {props.contextMenu && (
            <ContextMenuWrapper>{props.contextMenu}</ContextMenuWrapper>
          )}
        </EntityItem>
        <Collapse
          active={props.active}
          collapseRef={props.collapseRef}
          isOpen={!!isOpen}
          step={props.step}
        >
          {props.children}
        </Collapse>
      </Wrapper>
    );
  },
);

Entity.displayName = "Entity";

export default Entity;
