import { Checkbox, Flex, Text, Button } from "design-system";
import React, { useEffect, useMemo, useState } from "react";
import type {
  DatasourceColumns,
  DatasourceKeys,
  DatasourceStructure,
} from "entities/Datasource";
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
import styled from "styled-components";
import { change } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import PostgreSQL from "WidgetQueryGenerators/PostgreSQL";
import { getColumnsById } from "selectors/querySchemaSelectors";
import {
  initQuerySchema,
  updateQuerySchemaColumn,
} from "actions/queryScehmaActions";

export interface ColumnMeta {
  isSelected: boolean;
  binding: string;
}

export type Columns = Record<string, ColumnMeta>;

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
  const { currentActionId, datasourceId } = props;
  const dispatch = useDispatch();
  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  ) as DatasourceStructure | undefined;

  const columnsMeta = useSelector(getColumnsById(currentActionId));

  const { responseTabHeight } = useSelector(getQueryPaneDebuggerState);
  const [selectedTable, setSelectedTable] = useState<string | undefined>();

  const selectedTableItems = find(datasourceStructure?.tables || [], [
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

  const areSomeChecked = columnsMeta
    ? Object.values(columnsMeta).some(({ isSelected }) => isSelected)
    : false;

  const areAllChecked = useMemo(() => {
    const selectedColumns = columnsMeta
      ? Object.values(columnsMeta).filter(({ isSelected }) => isSelected)
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
          id: currentActionId,
          columnName,
          column: { isSelected, binding: "" },
        }),
      );
    };

  const handleWholeColumnSelection = (isSelected: boolean) => {
    for (const [columnName] of Object.entries(columnsMeta || {})) {
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
          id: currentActionId,
          columns: initialColumnsMeta,
        }),
      );
    }
  }, [columns, dispatch, currentActionId, columnsMeta]);

  useEffect(() => {
    const columnsToGenerateQuery: Array<{ name: string; value: string }> = [];

    for (const [columnName, columnMeta] of Object.entries(columnsMeta || {})) {
      if (columnMeta.isSelected) {
        columnsToGenerateQuery.push({
          name: columnName,
          value: columnMeta.binding,
        });
      }
    }

    dispatch(
      change(
        QUERY_EDITOR_FORM_NAME,
        "actionConfiguration.body",
        PostgreSQL.generateInsertBody(
          selectedTable || "",
          columnsToGenerateQuery,
        ),
      ),
    );
  }, [columnsMeta, selectedTable, dispatch]);

  useEffect(() => {
    setSelectedTable(undefined);
  }, [datasourceId]);

  useEffect(() => {
    if (!selectedTable && datasourceStructure?.tables?.length && !isLoading) {
      setSelectedTable(datasourceStructure.tables[0].name);
    }
  }, [selectedTable, datasourceId, isLoading, datasourceStructure?.tables]);

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

  const columnHasBinding = false;

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
        style={{ paddingBottom: 0 }}
      >
        {isLoading ? <RenderInterimDataState state="LOADING" /> : null}

        {!isLoading && columns.length === 0 ? (
          <RenderInterimDataState state="NOCOLUMNS" />
        ) : null}

        {!isLoading && (
          <Flex
            flex="1"
            flexDirection="column"
            gap="spaces-2"
            height={`${responseTabHeight - 45}px`}
            justifyContent={
              isLoading || columns.length === 0 ? "center" : "flex-start"
            }
            overflowY="scroll"
            // padding="spaces-3"
          >
            <Row style={{ border: "none" }}>
              <Checkbox
                isIndeterminate={areSomeChecked && !areAllChecked}
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
                    isSelected={columnsMeta?.[field.name]?.isSelected}
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
                    {columnHasBinding && (
                      <Brackets
                        kind="code"
                        onClick={handleBindingClick}
                      >{`{{ }}`}</Brackets>
                    )}

                    {field.type}
                  </div>
                </Row>
              );
            })}
          </Flex>
        )}
        {areSomeChecked && (
          <div
            style={{
              display: "sticky",
              bottom: 0,
              width: "100%",
              borderTop: "1px solid var(--ads-v2-color-border)",
              padding: "4px 0 0 0",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Button
                kind="secondary"
                onClick={() => {}}
                size="sm"
                startIcon="upgrade"
              >
                Generate UI
              </Button>
            </div>
          </div>
        )}
      </Flex>
    </Flex>
  );
};

export default Schema;
