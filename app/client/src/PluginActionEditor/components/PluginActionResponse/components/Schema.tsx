import { Flex } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import {
  DatasourceStructureContext,
  type DatasourceColumns,
  type DatasourceKeys,
} from "entities/Datasource";
import { DatasourceStructureContainer as DatasourceStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import { useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
} from "ee/selectors/entitiesSelector";
import DatasourceField from "pages/Editor/DatasourceInfo/DatasourceField";
import { find } from "lodash";
import type { AppState } from "ee/reducers";
import RenderInterimDataState from "pages/Editor/DatasourceInfo/RenderInterimDataState";
import { getPluginActionDebuggerState } from "PluginActionEditor/store";

interface Props {
  datasourceId: string;
  datasourceName: string;
  currentActionId: string;
}

const Schema = (props: Props) => {
  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasourceId),
  );
  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);
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
      gap="spaces-2"
      height={`${responseTabHeight - 45}px`}
      maxWidth="70rem"
      overflow="hidden"
    >
      <Flex
        data-testId="datasource-schema-container"
        flex="1"
        flexDirection="column"
        overflow="hidden"
        px="spaces-3"
      >
        <DatasourceStructureList
          context={DatasourceStructureContext.QUERY_EDITOR}
          datasourceStructure={datasourceStructure}
          onEntityTableClick={setSelectedTable}
          showRefresh
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
