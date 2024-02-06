import { Flex } from "design-system";
import React, { useEffect, useState } from "react";
import { DatasourceStructureContext } from "entities/Datasource";
import { DatasourceStructureContainer as DatasourceStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import { useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
} from "@appsmith/selectors/entitiesSelector";
import { getResponsePaneHeight } from "selectors/debuggerSelectors";
import DatasourceField from "pages/Editor/DatasourceInfo/DatasourceField";
import { find } from "lodash";
import type { AppState } from "@appsmith/reducers";
import RenderInterimDataState from "pages/Editor/DatasourceInfo/RenderInterimDataState";

interface Props {
  datasourceId: string;
  currentActionId: string;
}

const Schema = (props: Props) => {
  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, props.datasourceId),
  );
  const responsePaneHeight = useSelector(getResponsePaneHeight);
  const [selectedTable, setSelectedTable] = useState<string>();
  const columns =
    find(datasourceStructure?.tables, ["name", selectedTable])?.columns || [];

  useEffect(() => {
    if (!selectedTable && datasourceStructure?.tables?.length) {
      setSelectedTable(datasourceStructure.tables[0].name);
    }
  }, [datasourceStructure?.tables, selectedTable, props.datasourceId]);

  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );

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
      height={`${responsePaneHeight - 40}px`}
      overflow="hidden"
    >
      <Flex flex="1" flexDirection="column" overflow="hidden" px="spaces-3">
        <DatasourceStructureList
          context={DatasourceStructureContext.QUERY_EDITOR}
          currentActionId={props.currentActionId}
          datasourceId={props.datasourceId}
          datasourceStructure={datasourceStructure}
          onEntityTableClick={setSelectedTable}
          showRefresh
          step={0}
          tableName={selectedTable}
        />
      </Flex>
      <Flex
        borderLeft="1px solid var(--ads-v2-color-border)"
        flex="1"
        flexDirection="column"
        height="100%"
        justifyContent={
          isLoading || columns.length === 0 ? "center" : "flex-start"
        }
        overflowY="scroll"
        padding="spaces-3"
      >
        {isLoading ? <RenderInterimDataState state="LOADING" /> : null}
        {columns.length === 0 ? (
          <RenderInterimDataState state="NODATA" />
        ) : null}
        {!isLoading &&
          columns.map((field, index) => {
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
