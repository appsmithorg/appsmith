import { Button, Flex, Link } from "@appsmith/ads";
import React, { useCallback, useEffect, useState } from "react";
import {
  DatasourceStructureContext,
  type DatasourceColumns,
  type DatasourceKeys,
} from "entities/Datasource";
import { DatasourceStructureContainer as DatasourceStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getPluginImages,
  getPluginIdFromDatasourceId,
} from "ee/selectors/entitiesSelector";
import DatasourceField from "pages/Editor/DatasourceInfo/DatasourceField";
import { find } from "lodash";
import type { AppState } from "ee/reducers";
import RenderInterimDataState from "pages/Editor/DatasourceInfo/RenderInterimDataState";
import { getPluginActionDebuggerState } from "../../../store";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import history from "utils/history";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getAssetUrl } from "ee/utils/airgapHelpers";

interface Props {
  datasourceId: string;
  datasourceName: string;
  currentActionId: string;
}

const Schema = (props: Props) => {
  const dispatch = useDispatch();

  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasourceId),
  );
  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);

  const pluginId = useSelector((state) =>
    getPluginIdFromDatasourceId(state, props.datasourceId),
  );
  const pluginImages = useSelector((state) => getPluginImages(state));
  const datasourceIcon = pluginId ? pluginImages[pluginId] : undefined;

  const [selectedTable, setSelectedTable] = useState<string>();

  const selectedTableItems = find(datasourceStructure?.tables, [
    "name",
    selectedTable,
  ]);

  const columnsAndKeys: Array<DatasourceColumns | DatasourceKeys> = [];

  if (selectedTableItems) {
    columnsAndKeys.push(...selectedTableItems.keys);
    columnsAndKeys.push(...selectedTableItems.columns);
  }

  const columns =
    find(datasourceStructure?.tables, ["name", selectedTable])?.columns || [];

  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );

  useEffect(() => {
    setSelectedTable(undefined);
  }, [props.datasourceId]);
  useEffect(() => {
    if (!selectedTable && datasourceStructure?.tables?.length && !isLoading) {
      setSelectedTable(datasourceStructure.tables[0].name);
    }
  }, [selectedTable, props.datasourceId, isLoading, datasourceStructure]);

  const refreshStructure = useCallback(() => {
    dispatch(
      refreshDatasourceStructure(
        props.datasourceId,
        DatasourceStructureContext.QUERY_EDITOR,
      ),
    );
  }, [dispatch, props.datasourceId]);

  const goToDatasource = useCallback(() => {
    history.push(datasourcesEditorIdURL({ datasourceId: props.datasourceId }));
  }, [props.datasourceId]);

  if (!datasourceStructure) {
    return (
      <Flex alignItems="center" flex="1" height="100%" justifyContent="center">
        {isLoading ? (
          <RenderInterimDataState state="LOADING" />
        ) : (
          <RenderInterimDataState state="NODATA" />
        )}
      </Flex>
    );
  }

  return (
    <Flex
      flexDirection="row"
      gap="spaces-3"
      height={`${responseTabHeight - 45}px`}
      maxWidth="70rem"
      overflow="hidden"
    >
      <Flex
        data-testid="datasource-schema-container"
        flex="1"
        flexDirection="column"
        gap="spaces-3"
        overflow="hidden"
        padding="spaces-3"
        paddingRight="spaces-0"
      >
        <Flex
          alignItems={"center"}
          gap="spaces-2"
          justifyContent={"space-between"}
        >
          <Link onClick={goToDatasource}>
            <Flex
              alignItems={"center"}
              gap="spaces-1"
              justifyContent={"center"}
            >
              <EntityIcon height={`16px`} width={`16px`}>
                <img alt="entityIcon" src={getAssetUrl(datasourceIcon)} />
              </EntityIcon>
              {props.datasourceName}
            </Flex>
          </Link>
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
          datasourceStructure={datasourceStructure}
          onEntityTableClick={setSelectedTable}
          step={0}
          tableName={selectedTable}
          {...props}
        />
      </Flex>
      <Flex
        borderLeft="1px solid var(--ads-v2-color-border)"
        flex="1"
        flexDirection="column"
        height={`${responseTabHeight - 45}px`}
        justifyContent={
          isLoading || columns.length === 0 ? "center" : "flex-start"
        }
        overflowY="scroll"
        padding="spaces-3"
      >
        {isLoading ? <RenderInterimDataState state="LOADING" /> : null}
        {!isLoading && columns.length === 0 ? (
          <RenderInterimDataState state="NOCOLUMNS" />
        ) : null}
        {!isLoading &&
          columnsAndKeys.map((field, index) => {
            return (
              <DatasourceField
                field={field}
                key={`${field.name}${index}`}
                step={0}
              />
            );
          })}
      </Flex>
    </Flex>
  );
};

export default Schema;
