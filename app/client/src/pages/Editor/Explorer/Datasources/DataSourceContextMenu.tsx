import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  CONTEXT_RENAME,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "ee/constants/messages";
import type { AppState } from "ee/reducers";

import { getDatasource } from "ee/selectors/entitiesSelector";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasDeleteDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";

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

  const [confirmDelete, setConfirmDelete] = useState(false);

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const datasourcePermissions = datasource?.userPermissions || [];

  const canDeleteDatasource = getHasDeleteDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const canManageDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const treeOptions = [
    canManageDatasource && {
      value: "rename",
      className: "single-select t--datasource-rename",
      onSelect: editDatasourceName,
      label: createMessage(CONTEXT_RENAME),
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
    <ContextMenu
      className={props.className}
      optionTree={treeOptions as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
      triggerId={"add-datasource"}
    />
  ) : null;
}

export default DataSourceContextMenu;
