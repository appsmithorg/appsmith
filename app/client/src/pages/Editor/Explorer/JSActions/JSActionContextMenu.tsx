import React, { useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  moveJSCollectionRequest,
  copyJSCollectionRequest,
  deleteJSCollection,
} from "actions/jsActionActions";
import noop from "lodash/noop";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_RENAME,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "ee/constants/messages";
import { getPageListAsOptions } from "ee/selectors/entitiesSelector";

import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import {
  ActionEntityContextMenuItemsEnum,
  FilesContext,
} from "../Files/FilesContextProvider";

interface EntityContextMenuProps {
  id: string;
  name: string;
  className?: string;
  canManage: boolean;
  canDelete: boolean;
  hideMenuItems: boolean;
}

export function JSCollectionEntityContextMenu(props: EntityContextMenuProps) {
  // Import the context
  const context = useContext(FilesContext);
  const { menuItems, parentEntityId } = context;

  const { canDelete, canManage } = props;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();

  const showBinding = useCallback(
    (actionId, actionName) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: actionId,
          entityName: actionName,
          entityType: ENTITY_TYPE.JSACTION,
          show: true,
        },
      }),
    [],
  );

  const copyJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) => {
      dispatch(
        copyJSCollectionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: actionName,
        }),
      );
    },
    [dispatch],
  );
  const moveJSCollectionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) => {
      dispatch(
        moveJSCollectionRequest({
          id: actionId,
          destinationPageId,
          name: actionName,
        }),
      );
    },
    [dispatch, parentEntityId],
  );
  const deleteJSCollectionFromPage = useCallback(
    (actionId: string, actionName: string) =>
      dispatch(deleteJSCollection({ id: actionId, name: actionName })),
    [dispatch],
  );

  const menuPages = useSelector(getPageListAsOptions);
  const editJSCollectionName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.id)),
    [dispatch, props.id],
  );

  const optionsTree = [
    menuItems.includes(ActionEntityContextMenuItemsEnum.RENAME) &&
      canManage && {
        value: "rename",
        onSelect: editJSCollectionName,
        label: createMessage(CONTEXT_RENAME),
      },
    menuItems.includes(ActionEntityContextMenuItemsEnum.SHOW_BINDING) && {
      value: "showBinding",
      onSelect: () => showBinding(props.id, props.name),
      label: createMessage(CONTEXT_SHOW_BINDING),
    },
    menuItems.includes(ActionEntityContextMenuItemsEnum.COPY) &&
      canManage && {
        value: "copy",
        onSelect: noop,
        label: createMessage(CONTEXT_COPY),
        children: menuPages.map((page) => {
          return {
            ...page,
            onSelect: () =>
              copyJSCollectionToPage(props.id, props.name, page.id),
          };
        }),
      },
    menuItems.includes(ActionEntityContextMenuItemsEnum.MOVE) &&
      canManage && {
        value: "move",
        onSelect: noop,
        label: createMessage(CONTEXT_MOVE),
        children:
          menuPages.length > 1
            ? menuPages
                .filter((page) => page.id !== parentEntityId) // Remove current page from the list
                .map((page) => {
                  return {
                    ...page,
                    onSelect: () =>
                      moveJSCollectionToPage(props.id, props.name, page.id),
                  };
                })
            : [
                {
                  value: "No Pages",
                  onSelect: noop,
                  label: createMessage(CONTEXT_NO_PAGE),
                },
              ],
      },
    menuItems.includes(ActionEntityContextMenuItemsEnum.DELETE) &&
      canDelete && {
        confirmDelete: confirmDelete,
        className: "t--apiFormDeleteBtn single-select",
        value: "delete",
        onSelect: () => {
          confirmDelete
            ? deleteJSCollectionFromPage(props.id, props.name)
            : setConfirmDelete(true);
        },
        label: confirmDelete
          ? createMessage(CONFIRM_CONTEXT_DELETE)
          : createMessage(CONTEXT_DELETE),
        intent: "danger",
      },
  ].filter(Boolean);

  return !props.hideMenuItems && optionsTree.length > 0 ? (
    <ContextMenu
      className={props.className}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  ) : null;
}

export default JSCollectionEntityContextMenu;
