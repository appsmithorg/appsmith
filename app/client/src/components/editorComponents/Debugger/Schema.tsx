import { Checkbox, Flex, Text } from "design-system";
import React, { useEffect, useMemo, useState } from "react";
import type { DatasourceColumns, DatasourceKeys } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import { DatasourceStructureContainer as DatasourceStructureList } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
} from "@appsmith/selectors/entitiesSelector";

import { find } from "lodash";
import type { AppState } from "@appsmith/reducers";
import RenderInterimDataState from "pages/Editor/DatasourceInfo/RenderInterimDataState";
import { getQueryPaneDebuggerState } from "selectors/queryPaneSelectors";
import { getColumnsById } from "selectors/querySchemaSelectors";
import styled from "styled-components";
import {
  initQuerySchema,
  updateQuerySchemaColumn,
} from "actions/querySchemaActions";
import type { Columns } from "reducers/uiReducers/querySchemaReducer";

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
  border-bottom: 1px solid #cdd5df;
`;

const Brackets = styled(Text)`
  letter-spacing: -3px;
  cursor: pointer;
`;

interface Props {
  datasourceId: string;
  datasourceName: string;
  currentActionId: string;
}

const Schema = (props: Props) => {
  const { datasourceId } = props;
  const dispatch = useDispatch();
  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  );

  const columnsMeta = useSelector(getColumnsById(datasourceId));

  const { responseTabHeight } = useSelector(getQueryPaneDebuggerState);
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

  const columns = useMemo(() => {
    return (
      find(datasourceStructure?.tables, ["name", selectedTable])?.columns || []
    );
  }, [datasourceStructure, selectedTable]);

  const areSomeChecked = useMemo(() => {
    const selectedColumns = columnsMeta
      ? Object.values(columnsMeta).filter((column) => column.isSelected)
      : [];
    return (
      selectedColumns.length > 0 && selectedColumns.length - 1 < columns.length
    );
  }, [columnsMeta, columns]);

  const areAllChecked = useMemo(() => {
    const selectedColumns = columnsMeta
      ? Object.values(columnsMeta).filter((column) => column.isSelected)
      : [];
    return selectedColumns.length - 1 === columns.length;
  }, [columnsMeta, columns]);

  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, datasourceId),
  );

  // eslint-disable-next-line no-console
  const handleBindingClick = console.log;

  const handleColumnSelection =
    (columnName: string) => (isSelected: boolean) => {
      dispatch(
        updateQuerySchemaColumn({
          id: datasourceId,
          columnName,
          column: { isSelected, binding: "" },
        }),
      );
    };

  const handleWholeColumnSelection = (isSelected: boolean) => {
    for (const [columnName] of Object.entries(columnsMeta)) {
      handleColumnSelection(columnName)(isSelected);
    }
  };

  useEffect(() => {
    if (!columnsMeta && columns.length) {
      const initialColumnsMeta: Columns = {};
      for (const { name } of columns) {
        initialColumnsMeta[name] = {
          isSelected: false,
          binding: "",
        };
      }

      dispatch(
        initQuerySchema({
          id: datasourceId,
          columns: initialColumnsMeta,
        }),
      );
    }
  }, [columns, dispatch, datasourceId, columnsMeta]);

  useEffect(() => {
    setSelectedTable(undefined);
  }, [datasourceId]);

  useEffect(() => {
    if (!selectedTable && datasourceStructure?.tables?.length && !isLoading) {
      setSelectedTable(datasourceStructure.tables[0].name);
    }
  }, [selectedTable, datasourceId, isLoading, datasourceStructure.tables]);

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
        gap="spaces-2"
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

        {!isLoading && (
          <>
            <Row style={{ border: "none" }}>
              <Checkbox
                isIndeterminate={areSomeChecked}
                isSelected={areAllChecked}
                onChange={handleWholeColumnSelection}
              >
                <Text kind="heading-s">Columns</Text>
              </Checkbox>
              <Text kind="heading-s">Values</Text>
            </Row>
            {columnsAndKeys.map((field) => {
              return (
                <Row key={field.name}>
                  <Checkbox
                    isSelected={columnsMeta[field.name]?.isSelected}
                    onChange={handleColumnSelection(field.name)}
                  >
                    {field.name}
                  </Checkbox>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 8,
                      width: "auto",
                    }}
                  >
                    <Brackets
                      kind="code"
                      onClick={handleBindingClick}
                    >{`{{ }}`}</Brackets>
                    {field.type}
                  </div>
                </Row>
              );
            })}
          </>
        )}
      </Flex>
    </Flex>
  );
};

export default Schema;
