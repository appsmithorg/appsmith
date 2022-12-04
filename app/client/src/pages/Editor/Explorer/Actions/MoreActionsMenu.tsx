import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppState } from "@appsmith/reducers";

import {
  moveActionRequest,
  copyActionRequest,
  deleteAction,
} from "actions/pluginActionActions";

import { ContextMenuPopoverModifiers } from "../helpers";
import { noop } from "lodash";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import { useNewActionName } from "./helpers";
import styled from "styled-components";
import { Classes, Icon, IconSize } from "design-system";
import { Intent, Position } from "@blueprintjs/core";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_MOVE,
  createMessage,
} from "@appsmith/constants/messages";
import { IconName } from "@blueprintjs/icons";

type EntityContextMenuProps = {
  id: string;
  name: string;
  className?: string;
  pageId: string;
  isChangePermitted?: boolean;
  isDeletePermitted?: boolean;
};

export const MoreActionablesContainer = styled.div<{ isOpen?: boolean }>`
  width: 34px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  &&&& span {
    width: auto;
  }

  .${Classes.ICON} {
    fill: ${(props) => props.theme.colors.treeDropdown.targetIcon.normal};
  }

  ${(props) =>
    props.isOpen
      ? `
		background-color: ${props.theme.colors.treeDropdown.targetBg};

    &&&& .${Classes.ICON} {
      fill: ${props.theme.colors.treeDropdown.targetIcon.hover};
    }
	`
      : null}

  &:hover {
    background-color: ${(props) => props.theme.colors.treeDropdown.targetBg};

    &&&& .${Classes.ICON} {
      fill: ${(props) => props.theme.colors.treeDropdown.targetIcon.hover};
    }
  }
`;

export function MoreActionsMenu(props: EntityContextMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nextEntityName = useNewActionName();
  const guidedTourEnabled = useSelector(inGuidedTour);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { isChangePermitted = false, isDeletePermitted = false } = props;

  const dispatch = useDispatch();
  const copyActionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyActionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(`${actionName}Copy`, pageId),
        }),
      ),
    [dispatch, nextEntityName],
  );
  const moveActionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) =>
      dispatch(
        moveActionRequest({
          id: actionId,
          destinationPageId,
          originalPageId: props.pageId,
          name: nextEntityName(actionName, destinationPageId),
        }),
      ),
    [dispatch, nextEntityName, props.pageId],
  );
  const deleteActionFromPage = useCallback(
    (actionId: string, actionName: string) => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }

      dispatch(deleteAction({ id: actionId, name: actionName }));
    },
    [dispatch, guidedTourEnabled],
  );

  const menuPages = useSelector((state: AppState) => {
    return state.entities.pageList.pages.map((page) => ({
      label: page.pageName,
      id: page.pageId,
      value: page.pageName,
    }));
  });

  const options = [
    ...(isChangePermitted
      ? [
          {
            icon: "duplicate" as IconName,
            value: "copy",
            onSelect: noop,
            label: createMessage(CONTEXT_COPY),
            children: menuPages.map((page) => {
              return {
                ...page,
                onSelect: () => copyActionToPage(props.id, props.name, page.id),
              };
            }),
          },
        ]
      : []),
    ...(isChangePermitted
      ? [
          {
            icon: "swap-horizontal" as IconName,
            value: "move",
            onSelect: noop,
            label: createMessage(CONTEXT_MOVE),
            children:
              menuPages.length > 1
                ? menuPages
                    .filter((page) => page.id !== props.pageId) // Remove current page from the list
                    .map((page) => {
                      return {
                        ...page,
                        onSelect: () =>
                          moveActionToPage(props.id, props.name, page.id),
                      };
                    })
                : [
                    {
                      value: "No Pages",
                      onSelect: noop,
                      label: "No Pages",
                    },
                  ],
          },
        ]
      : []),
    ...(isDeletePermitted
      ? [
          {
            confirmDelete: confirmDelete,
            icon: "trash" as IconName,
            value: "delete",
            onSelect: () => {
              confirmDelete
                ? deleteActionFromPage(props.id, props.name)
                : setConfirmDelete(true);
            },
            label: confirmDelete
              ? createMessage(CONFIRM_CONTEXT_DELETE)
              : createMessage(CONTEXT_DELETE),
            intent: Intent.DANGER,
            className: "t--apiFormDeleteBtn",
          },
        ]
      : []),
  ];

  return options.length > 0 ? (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onMenuToggle={(isOpen: boolean) => setIsMenuOpen(isOpen)}
      onSelect={noop}
      optionTree={options}
      position={Position.LEFT_TOP}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={
        <MoreActionablesContainer
          className={props.className}
          isOpen={isMenuOpen}
        >
          <Icon name="context-menu" size={IconSize.XXXL} />
        </MoreActionablesContainer>
      }
    />
  ) : null;
}

export default MoreActionsMenu;
