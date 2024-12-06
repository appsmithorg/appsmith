import { Flex, Button, Tooltip } from "@appsmith/ads";
import {
  DatasourceStructureContext,
  type DatasourceStructure,
} from "entities/Datasource";
import { DatasourceStructureContainer as DatasourceStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import React, { useCallback } from "react";
import DatasourceSelector from "./DatasourceSelector";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import { useDispatch } from "react-redux";
import { SchemaTableContainer } from "./styles";
import { createMessage, EDIT_DS_CONFIG } from "ee/constants/messages";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import history from "utils/history";
import { omit } from "lodash";
import { getQueryParams } from "utils/URLUtils";
import { useEditorType } from "ee/hooks";
import { useParentEntityInfo } from "ee/hooks/datasourceEditorHooks";

interface Props {
  datasourceId: string;
  datasourceName: string;
  currentActionId: string;
  datasourceStructure: DatasourceStructure;
  setSelectedTable: (table: string) => void;
  selectedTable: string | undefined;
}

const SchemaTables = ({
  currentActionId,
  datasourceId,
  datasourceName,
  datasourceStructure,
  selectedTable,
  setSelectedTable,
}: Props) => {
  const dispatch = useDispatch();
  const editorType = useEditorType(location.pathname);
  const { parentEntityId } = useParentEntityInfo(editorType);

  const refreshStructure = useCallback(() => {
    dispatch(
      refreshDatasourceStructure(
        datasourceId,
        DatasourceStructureContext.QUERY_EDITOR,
      ),
    );
  }, [dispatch, datasourceId]);

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const editDatasource = () => {
    const entryPoint = DatasourceEditEntryPoints.QUERY_EDITOR_DATASOURCE_SCHEMA;

    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId: datasourceId,
      pluginName: "",
      entryPoint: entryPoint,
    });

    const url = datasourcesEditorIdURL({
      baseParentEntityId: parentEntityId,
      datasourceId: datasourceId,
      params: { ...omit(getQueryParams(), "viewMode"), viewMode: false },
      generateEditorPath: true,
    });

    history.push(url);
  };

  return (
    <SchemaTableContainer
      data-testid="t--datasource-schema-container"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      padding="spaces-3"
      paddingBottom="spaces-0"
      w="400px"
    >
      <Flex
        alignItems={"center"}
        gap="spaces-2"
        justifyContent={"space-between"}
      >
        <Flex alignItems={"center"} gap="spaces-2">
          <DatasourceSelector
            datasourceId={datasourceId}
            datasourceName={datasourceName}
          />
          <Tooltip content={createMessage(EDIT_DS_CONFIG)} placement="top">
            <Button
              isIconButton
              kind="tertiary"
              onClick={editDatasource}
              size="sm"
              startIcon="datasource-config"
            />
          </Tooltip>
        </Flex>
        <Button
          className="datasourceStructure-refresh"
          isIconButton
          kind="tertiary"
          onClick={refreshStructure}
          size="sm"
          startIcon="refresh"
        />
      </Flex>
      <DatasourceStructureList
        context={DatasourceStructureContext.QUERY_EDITOR}
        currentActionId={currentActionId}
        datasourceId={datasourceId}
        datasourceName={datasourceName}
        datasourceStructure={datasourceStructure}
        onEntityTableClick={setSelectedTable}
        step={0}
        tableName={selectedTable}
      />
    </SchemaTableContainer>
  );
};

export { SchemaTables };
