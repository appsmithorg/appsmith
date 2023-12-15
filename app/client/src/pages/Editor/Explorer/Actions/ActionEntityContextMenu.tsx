import {
  copyActionRequest,
  deleteAction,
  moveActionRequest,
} from "actions/pluginActionActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { noop } from "lodash";
import React, { useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPageListAsOptions } from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { useNewActionName } from "./helpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "@appsmith/constants/messages";
import { builderURL } from "@appsmith/RouteBuilder";

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
  canManageAction: boolean;
  canDeleteAction: boolean;
}
export function ActionEntityContextMenu(props: EntityContextMenuProps) {
  // Import the context
  const context = useContext(FilesContext);
  const { menuItems, parentEntityId } = context;

  const { canDeleteAction, canManageAction } = props;
  const nextEntityName = useNewActionName();
  const guidedTourEnabled = useSelector(inGuidedTour);
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const copyActionToPage = useCallback(
    (actionId: string, actionName: string, pageId: string) =>
      dispatch(
        copyActionRequest({
          id: actionId,
          destinationPageId: pageId,
          name: nextEntityName(actionName, pageId, true),
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
          originalPageId: parentEntityId,
          name: nextEntityName(actionName, destinationPageId),
        }),
      ),
    [dispatch, nextEntityName, parentEntityId],
  );
  const deleteActionFromPage = useCallback(
    (actionId: string, actionName: string, onSuccess?: () => void) => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }

      dispatch(deleteAction({ id: actionId, name: actionName, onSuccess }));
    },
    [dispatch, guidedTourEnabled],
  );

  const menuPages = useSelector(getPageListAsOptions);

  const editActionName = useCallback(() => {
    if (guidedTourEnabled) {
      dispatch(toggleShowDeviationDialog(true));
      return;
    }
    dispatch(initExplorerEntityNameEdit(props.id));
  }, [dispatch, props.id, guidedTourEnabled]);

  const showBinding = useCallback(
    (actionId, actionName) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: actionId,
          entityName: actionName,
          entityType: ENTITY_TYPE.ACTION,
          show: true,
        },
      }),
    [],
  );

  const optionsTree = [
    menuItems.includes(ActionEntityContextMenuItemsEnum.EDIT_NAME) &&
      canManageAction && {
        value: "rename",
        onSelect: editActionName,
        label: createMessage(CONTEXT_EDIT_NAME),
      },
    menuItems.includes(ActionEntityContextMenuItemsEnum.SHOW_BINDING) && {
      value: "showBinding",
      onSelect: () => showBinding(props.id, props.name),
      label: createMessage(CONTEXT_SHOW_BINDING),
    },

    menuItems.includes(ActionEntityContextMenuItemsEnum.COPY) &&
      canManageAction && {
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
    menuItems.includes(ActionEntityContextMenuItemsEnum.MOVE) &&
      canManageAction && {
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
                      moveActionToPage(props.id, props.name, page.id),
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
      canDeleteAction && {
        confirmDelete: confirmDelete,
        className: "t--apiFormDeleteBtn single-select",
        value: "delete",
        label: confirmDelete
          ? createMessage(CONFIRM_CONTEXT_DELETE)
          : createMessage(CONTEXT_DELETE),
        intent: "danger",
        onSelect: () => {
          confirmDelete
            ? deleteActionFromPage(props.id, props.name, () => {
                history.push(builderURL({ pageId: parentEntityId }));
                setConfirmDelete(false);
              })
            : setConfirmDelete(true);
        },
      },
  ].filter(Boolean);

  return optionsTree.length > 0 ? (
    <ContextMenu
      className={props.className}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  ) : null;
}

export default ActionEntityContextMenu;
