import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteDatasource,
  refreshDatasourceStructure,
} from "actions/datasourceActions";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { noop } from "lodash";
import { ContextMenuPopoverModifiers } from "@appsmith/pages/Editor/Explorer/helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  CONTEXT_EDIT_NAME,
  CONTEXT_REFRESH,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";
import {
  hasDeleteDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";
import type { TreeDropdownOption } from "design-system-old";
import { getDatasource } from "selectors/entitiesSelector";

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

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const datasourcePermissions = datasource?.userPermissions || [];

  const canDeleteDatasource = hasDeleteDatasourcePermission(
    datasourcePermissions,
  );

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const treeOptions = [
    canManageDatasource && {
      value: "rename",
      className: "single-select t--datasource-rename",
      onSelect: editDatasourceName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    {
      value: "refresh",
      className: "single-select t--datasource-refresh",
      onSelect: dispatchRefresh,
      label: createMessage(CONTEXT_REFRESH),
    },
    canDeleteDatasource && {
      confirmDelete: confirmDelete,
      className: "t--apiFormDeleteBtn single-select t--datasource-delete",
      value: "delete",
      onSelect: () => {
        confirmDelete ? dispatchDelete() : setConfirmDelete(true);
      },
      label: confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE),
      intent: "danger",
    },
  ].filter(Boolean);

  return treeOptions.length > 0 ? (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={treeOptions && (treeOptions as TreeDropdownOption[])}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  ) : null;
}

export default DataSourceContextMenu;
