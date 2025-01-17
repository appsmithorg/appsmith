import {
  copyActionRequest,
  deleteAction,
  moveActionRequest,
} from "actions/pluginActionActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { noop } from "lodash";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPageListAsOptions } from "ee/selectors/entitiesSelector";
import history from "utils/history";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  CONTEXT_COPY,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_RENAME,
  CONTEXT_MOVE,
  CONTEXT_NO_PAGE,
  CONTEXT_SHOW_BINDING,
  createMessage,
  CONTEXT_DUPLICATE,
} from "ee/constants/messages";
import { builderURL } from "ee/RouteBuilder";

import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { useConvertToModuleOptions } from "ee/pages/Editor/Explorer/hooks";
import { MODULE_TYPE } from "ee/constants/ModuleConstants";
import { PluginType } from "entities/Plugin";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { useLocation } from "react-router";
import {
  getIDETypeByUrl,
  getMenuItemsForActionEntityByIdeType,
} from "ee/entities/IDE/utils";
import {
  ActionEntityContextMenuItemsEnum,
  IDE_TYPE,
} from "ee/entities/IDE/constants";

export interface EntityContextMenuProps {
  id: string;
  name: string;
  canManageAction: boolean;
  canDeleteAction: boolean;
  pluginType: PluginType;
  parentEntityId: string;
}
export function QueryEntityContextMenu(props: EntityContextMenuProps) {
  const { canDeleteAction, canManageAction, parentEntityId } = props;
  const dispatch = useDispatch();
  const location = useLocation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menuPages = useSelector(getPageListAsOptions);
  const ideType = getIDETypeByUrl(location.pathname);
  const menuItems = getMenuItemsForActionEntityByIdeType(ideType);

  const copyAction = useCallback(
    (actionId: string, actionName: string, destinationEntityId: string) =>
      dispatch(
        copyActionRequest({
          id: actionId,
          destinationEntityId,
          name: actionName,
        }),
      ),
    [dispatch],
  );
  const moveActionToPage = useCallback(
    (actionId: string, actionName: string, destinationPageId: string) =>
      dispatch(
        moveActionRequest({
          id: actionId,
          destinationPageId,
          originalPageId: parentEntityId,
          name: actionName,
        }),
      ),
    [dispatch, parentEntityId],
  );
  const deleteActionFromPage = useCallback(
    (actionId: string, actionName: string, onSuccess?: () => void) => {
      dispatch(deleteAction({ id: actionId, name: actionName, onSuccess }));
    },
    [dispatch],
  );

  const convertQueryToModuleOption = useConvertToModuleOptions({
    id: props.id,
    moduleType: MODULE_TYPE.QUERY,
    canDelete: canDeleteAction,
  });

  const editActionName = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(props.id));
  }, [dispatch, props.id]);

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
    menuItems.includes(ActionEntityContextMenuItemsEnum.RENAME) &&
      canManageAction && {
        value: "rename",
        onSelect: editActionName,
        label: createMessage(CONTEXT_RENAME),
      },
    menuItems.includes(ActionEntityContextMenuItemsEnum.SHOW_BINDING) && {
      value: "showBinding",
      onSelect: () => showBinding(props.id, props.name),
      label: createMessage(CONTEXT_SHOW_BINDING),
    },
    menuItems.includes(
      ActionEntityContextMenuItemsEnum.CONVERT_QUERY_MODULE_INSTANCE,
    ) &&
      props.pluginType !== PluginType.INTERNAL &&
      convertQueryToModuleOption,
    menuItems.includes(ActionEntityContextMenuItemsEnum.COPY) &&
      canManageAction && {
        value: "copy",
        onSelect:
          ideType === IDE_TYPE.App
            ? noop
            : () => {
                copyAction(props.id, props.name, parentEntityId);
              },
        label: createMessage(
          ideType === IDE_TYPE.App ? CONTEXT_COPY : CONTEXT_DUPLICATE,
        ),
        children:
          ideType === IDE_TYPE.App &&
          menuPages.length > 0 &&
          menuPages.map((page) => {
            return {
              ...page,
              onSelect: () => copyAction(props.id, props.name, page.id),
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
                history.push(
                  builderURL({ baseParentEntityId: parentEntityId }),
                );
                setConfirmDelete(false);
              })
            : setConfirmDelete(true);
        },
      },
  ].filter(Boolean);

  return optionsTree.length > 0 ? (
    <ContextMenu
      className={EntityClassNames.CONTEXT_MENU}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  ) : null;
}
