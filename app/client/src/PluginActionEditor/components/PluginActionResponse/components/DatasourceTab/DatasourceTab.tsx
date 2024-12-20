import { Flex } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import { DatasourceStructureContext } from "entities/Datasource";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getPluginIdFromDatasourceId,
  getPluginDatasourceComponentFromId,
  getDatasource,
} from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import history from "utils/history";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { DatasourceComponentTypes } from "api/PluginApi";
import { getPluginActionDebuggerState } from "PluginActionEditor/store";
import { SchemaDisplayStatus, StatusDisplay } from "./StatusDisplay";
import { DatasourceTables } from "./DatasourceTables";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isEmpty, omit } from "lodash";
import { getQueryParams } from "utils/URLUtils";
import { TableColumns } from "./TableColumns";
import { BOTTOMBAR_HEIGHT } from "./constants";
import { useEditorType } from "ee/hooks";
import { useParentEntityInfo } from "ee/hooks/datasourceEditorHooks";
import DatasourceInfo from "./DatasourceInfo";
import { getPlugin } from "ee/selectors/entitiesSelector";
import {
  getHasCreateDatasourceActionPermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

interface Props {
  datasourceId: string;
  datasourceName: string;
  currentActionId: string;
}

const DatasourceTab = (props: Props) => {
  const dispatch = useDispatch();

  const { datasourceId, datasourceName } = props;

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  );

  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);

  const pluginId = useSelector((state) =>
    getPluginIdFromDatasourceId(state, datasourceId),
  );

  const plugin = useSelector((state) => getPlugin(state, pluginId || ""));

  const editorType = useEditorType(location.pathname);
  const { parentEntityId } = useParentEntityInfo(editorType);

  const [selectedTable, setSelectedTable] = useState<string>();

  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, datasourceId),
  );

  const pluginDatasourceForm = useSelector((state) =>
    getPluginDatasourceComponentFromId(state, pluginId || ""),
  );

  const datasource = useSelector((state) => getDatasource(state, datasourceId));

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasourceActions = getHasCreateDatasourceActionPermission(
    isFeatureEnabled,
    datasource?.userPermissions || [],
  );

  const canManageDatasourceActions = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasource?.userPermissions || [],
  );

  useEffect(
    function resetSelectedTable() {
      setSelectedTable(undefined);
    },
    [datasourceId],
  );

  useEffect(
    function fetchDatasourceStructureEffect() {
      function fetchStructure() {
        if (
          datasourceId &&
          datasourceStructure === undefined &&
          pluginDatasourceForm !==
            DatasourceComponentTypes.RestAPIDatasourceForm
        ) {
          dispatch(
            fetchDatasourceStructure(
              datasourceId,
              true,
              DatasourceStructureContext.QUERY_EDITOR,
            ),
          );
        }
      }

      fetchStructure();
    },
    [datasourceId, datasourceStructure, dispatch, pluginDatasourceForm],
  );

  useEffect(
    function selectFirstTable() {
      if (!selectedTable && datasourceStructure?.tables?.length && !isLoading) {
        setSelectedTable(datasourceStructure.tables[0].name);
      }
    },
    [selectedTable, datasourceId, isLoading, datasourceStructure],
  );

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const editDatasource = () => {
    const entryPoint = DatasourceEditEntryPoints.QUERY_EDITOR_DATASOURCE_SCHEMA;

    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId,
      pluginName: "",
      entryPoint: entryPoint,
    });

    const url = datasourcesEditorIdURL({
      baseParentEntityId: parentEntityId,
      datasourceId,
      params: { ...omit(getQueryParams(), "viewMode"), viewMode: false },
      generateEditorPath: true,
    });

    history.push(url);
  };

  const getStatusState = () => {
    if (isLoading) return SchemaDisplayStatus.SCHEMA_LOADING;

    if (!canCreateDatasourceActions) return SchemaDisplayStatus.NOACCESS;

    if (!datasourceStructure) return SchemaDisplayStatus.NOSCHEMA;

    if (datasourceStructure && "error" in datasourceStructure)
      return SchemaDisplayStatus.FAILED;

    if (isEmpty(datasourceStructure)) return SchemaDisplayStatus.CANTSHOW;

    return null;
  };

  const statusState = getStatusState();

  const renderStatus = () => {
    if (!statusState) {
      return null;
    }

    return (
      <Flex flexDirection="column" padding="spaces-3">
        <DatasourceInfo
          datasourceId={datasourceId}
          datasourceName={datasourceName}
          plugin={plugin}
          showEditButton={!isLoading && canManageDatasourceActions}
        />
        <StatusDisplay
          editDatasource={editDatasource}
          errorMessage={
            datasourceStructure?.error && "message" in datasourceStructure.error
              ? datasourceStructure.error.message
              : ""
          }
          state={statusState}
        />
      </Flex>
    );
  };

  const renderContent = () => {
    if (statusState) {
      return null;
    }

    return (
      <Flex h="100%">
        <DatasourceTables
          currentActionId={props.currentActionId}
          datasourceId={datasourceId}
          datasourceName={datasourceName}
          datasourceStructure={datasourceStructure}
          plugin={plugin}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
        />
        <TableColumns
          datasourceStructure={datasourceStructure}
          isLoading={isLoading}
          selectedTable={selectedTable}
        />
      </Flex>
    );
  };

  return (
    <Flex
      flexDirection="column"
      gap="spaces-3"
      height={`${responseTabHeight - BOTTOMBAR_HEIGHT}px`}
      overflow="hidden"
    >
      {renderStatus()}
      {renderContent()}
    </Flex>
  );
};

export { DatasourceTab };
