import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteDatasource,
  refreshDatasourceStructure,
} from "actions/datasourceActions";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { noop } from "lodash";
import { ContextMenuPopoverModifiers } from "../helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  CONTEXT_EDIT_NAME,
  CONTEXT_REFRESH,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import { AppState } from "@appsmith/reducers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { getCurrentAppWorkspace } from "selectors/workspaceSelectors";

export function DataSourceContextMenu(props: {
  datasourceId: string;
  entityId: string;
  className?: string;
}) {
  const dispatch = useDispatch();
  const dispatchDelete = useCallback(() => {
    dispatch(deleteDatasource({ id: props.datasourceId }));
  }, [dispatch, props.datasourceId]);
  const editDatasourceName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.entityId)),
    [dispatch, props.entityId],
  );
  const dispatchRefresh = useCallback(() => {
    dispatch(refreshDatasourceStructure(props.datasourceId));
  }, [dispatch, props.datasourceId]);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canDeleteDatasource = isPermitted(
    userWorkspacePermissions,
    PERMISSION_TYPE.DELETE_DATASOURCE,
  );

  const treeOptions = [
    {
      value: "rename",
      onSelect: editDatasourceName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    {
      value: "refresh",
      onSelect: dispatchRefresh,
      label: createMessage(CONTEXT_REFRESH),
    },
  ];

  const deleteOption = [
    {
      confirmDelete: confirmDelete,
      className: "t--apiFormDeleteBtn single-select",
      value: "delete",
      onSelect: () => {
        confirmDelete ? dispatchDelete() : setConfirmDelete(true);
      },
      label: confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE),
      intent: "danger",
    },
  ];

  return (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={[
        ...treeOptions,
        ...(canDeleteDatasource ? deleteOption : []),
      ].filter(Boolean)}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  );
}

export default DataSourceContextMenu;
