import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteDatasource,
  refreshDatasourceStructure,
} from "actions/datasourceActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  CONTEXT_EDIT_NAME,
  CONTEXT_REFRESH,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";

import { getDatasource } from "@appsmith/selectors/entitiesSelector";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasDeleteDatasourcePermission,
  getHasManageDatasourcePermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { DatasourceStructureContext } from "entities/Datasource";

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
    dispatch(
      refreshDatasourceStructure(
        props.datasourceId,
        DatasourceStructureContext.EXPLORER,
      ),
    );
  }, [dispatch, props.datasourceId]);

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
    <ContextMenu
      className={props.className}
      optionTree={treeOptions as TreeDropdownOption[]}
      setConfirmDelete={setConfirmDelete}
      triggerId={"add-datasource"}
    />
  ) : null;
}

export default DataSourceContextMenu;
