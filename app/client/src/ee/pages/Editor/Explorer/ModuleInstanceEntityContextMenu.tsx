import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "@appsmith/constants/messages";

import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { deleteModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";

interface EntityContextMenuProps {
  id: string;
  name: string;
  className?: string;
  pageId: string;
  canManage?: boolean;
  canDelete?: boolean;
}
export function ModuleInstanceEntityContextMenu(props: EntityContextMenuProps) {
  const { canDelete = false, canManage = false } = props;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dispatch = useDispatch();

  const showBinding = useCallback(
    (id, name) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: id,
          entityName: name,
          entityType: ENTITY_TYPE.MODULE_INSTANCE,
          show: true,
        },
      }),
    [],
  );

  const deleteModuleInstanceFromPage = (id: string) => {
    dispatch(deleteModuleInstance({ id }));
  };

  const editModuleInstanceName = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(props.id));
  }, [dispatch, props.id]);

  const optionsTree = [
    canManage && {
      value: "rename",
      onSelect: editModuleInstanceName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    {
      value: "showBinding",
      onSelect: () => showBinding(props.id, props.name),
      label: createMessage(CONTEXT_SHOW_BINDING),
    },
    canDelete && {
      confirmDelete: confirmDelete,
      className: "t--apiFormDeleteBtn single-select",
      value: "delete",
      onSelect: () => {
        confirmDelete
          ? deleteModuleInstanceFromPage(props.id)
          : setConfirmDelete(true);
      },
      label: confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE),
      intent: "danger",
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

export default ModuleInstanceEntityContextMenu;
