import { initExplorerEntityNameEdit } from "actions/explorerActions";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import history from "utils/history";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_EDIT_NAME,
  createMessage,
} from "@appsmith/constants/messages";
import { currentPackageEditorURL } from "@appsmith/RouteBuilder";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import {
  deleteModule,
  type DeleteModulePayload,
} from "@appsmith/actions/moduleActions";

interface EntityContextMenuProps {
  id: string;
  name: string;
  className?: string;
  canManageModule?: boolean;
  canDeleteModule?: boolean;
}
export function ModuleEntityContextMenu(props: EntityContextMenuProps) {
  const { canDeleteModule = false, canManageModule = false } = props;
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const onDeleteModule = ({ id, onSuccess }: DeleteModulePayload) => {
    dispatch(deleteModule({ id, onSuccess }));
  };

  const onEditModuleName = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(props.id));
  }, [props.id]);

  const optionsTree = [
    canManageModule && {
      value: "rename",
      onSelect: onEditModuleName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    canDeleteModule && {
      confirmDelete: confirmDelete,
      className: "t--apiFormDeleteBtn single-select",
      value: "delete",
      label: confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE),
      intent: "danger",
      onSelect: () => {
        confirmDelete
          ? onDeleteModule({
              id: props.id,
              onSuccess: () => {
                history.push(currentPackageEditorURL());
                setConfirmDelete(false);
              },
            })
          : setConfirmDelete(true);
      },
    },
  ].filter(Boolean);

  if (!optionsTree.length) return null;

  return (
    <ContextMenu
      className={props.className}
      optionTree={optionsTree as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
    />
  );
}

export default ModuleEntityContextMenu;
