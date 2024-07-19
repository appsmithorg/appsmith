import React, { useCallback, useEffect, useMemo, useState } from "react";
import { faker } from "@faker-js/faker";
import { Checkbox, Flex, Text, Button } from "design-system";
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
import {
  addSuggestedWidget,
  updateWIdgetProperty,
} from "actions/widgetActions";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import store from "store";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgetProps } from "pages/Editor/QueryEditor/BindDataButton";
import type { SuggestedWidget } from "api/ActionAPI";
import { generateReactKey } from "utils/generators";
import type { Columns } from "reducers/uiReducers/querySchemaReducer";

faker.seed(123);

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

const getRandomValueByType = (type: string) => {
  switch (type) {
    case "gender":
      return faker.name.gender(true);
    case "phone":
      return faker.phone.number();
    case "email":
      return faker.internet.email();
    case "country":
      return faker.address.country();
    case "name":
      return faker.name.firstName();
    case "latitude":
      return faker.address.latitude();
    case "longitude":
      return faker.address.longitude();
    case "primary key":
    case "primary_key":
      return faker.datatype.uuid();
    case "image":
      return faker.animal.type();
    case "text":
      return faker.lorem.word();
    case "int4":
    case "int8":
    case "int16":
    case "int32":
      return faker.random.numeric();
    case "boolean":
      return Math.random() >= 0.5;
    case "date":
    case "timestamp":
    case "timestamptz":
      return faker.date.past();
    default:
      return faker.lorem.word();
  }
};

function getBindingFromColumnsMeta(columnsMeta: Columns): string {
  // create bindingQuery as a stringified object using columnsMeta selected columns key as object key and value according to the columntype value
  const sourceData: Record<string, unknown> = {};
  for (const [columnName, columnMeta] of Object.entries(columnsMeta || {})) {
    if (columnMeta.isSelected) sourceData[columnName] = columnMeta.binding;
  }
  const bindingQuery = JSON.stringify(sourceData);
  return bindingQuery;
}

const Schema = (props: Props) => {
  const { currentActionId, datasourceId } = props;
  const dispatch = useDispatch();
  const datasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, datasourceId),
  ) as DatasourceStructure | undefined;

  const columnsMeta = useSelector(getColumnsById(currentActionId));
  const [widgetId, setWidgetId] = useState<string>("");

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

  const handleColumnSelection =
    (columnName: string) => (isSelected: boolean) => {
      dispatch(
        updateQuerySchemaColumn({
          id: currentActionId,
          columnName,
          column: {
            isSelected,
          },
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
        const { type: dataType } = find(columns, ["name", name]) ?? {
          type: "text",
        };

        const type = [
          "gender",
          "phone",
          "email",
          "country",
          "name",
          "latitude",
          "longitude",
          "image",
        ].includes(name)
          ? name
          : dataType;

        initialColumnsMeta[name] = {
          isSelected: false,
          binding: getRandomValueByType(type),
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
    const columnsToGenerateQuery: Array<{
      name: string;
      value: string;
    }> = [];

    for (const [columnName, columnMeta] of Object.entries(columnsMeta || {})) {
      if (columnMeta.isSelected) {
        columnsToGenerateQuery.push({
          name: columnName,
          value: String(columnMeta.binding),
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
    if (columnsMeta) {
      dispatch(
        updateWIdgetProperty({
          widgetId,
          propertyPath: "sourceData",
          propertyValue: getBindingFromColumnsMeta(columnsMeta),
        }),
      );
    }
  }, [columnsMeta, selectedTable, dispatch, widgetId]);

  useEffect(() => {
    setSelectedTable(undefined);
  }, [datasourceId]);

  useEffect(() => {
    if (!selectedTable && datasourceStructure?.tables?.length && !isLoading) {
      setSelectedTable(datasourceStructure.tables[0].name);
    }
  }, [selectedTable, datasourceId, isLoading, datasourceStructure?.tables]);

  const addWidget = useCallback(() => {
    const canvasWidgets = getWidgets(store.getState());
    const dataTree = getDataTree(store.getState());

    const suggestedWidget: SuggestedWidget = {
      type: "JSON_FORM_WIDGET",
      bindingQuery: columnsMeta ? getBindingFromColumnsMeta(columnsMeta) : "",
    };

    const widgetName = getNextWidgetName(
      canvasWidgets,
      suggestedWidget.type,
      dataTree,
    );
    const widgetInfo = {
      label: "sourceData",
      propertyName: "sourceData",
      widgetName,
    };

    const payload: any = getWidgetProps(
      suggestedWidget,
      widgetInfo,
      "",
      widgetName,
    );

    payload.skipWidgetSelection = true;
    payload.newWidgetId = generateReactKey();
    setWidgetId(payload.newWidgetId);

    dispatch(addSuggestedWidget(payload));
  }, [columnsMeta, dispatch]);

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
                    {Boolean(columnsMeta?.[field.name]?.binding) && (
                      <Brackets kind="code">{`{{ }}`}</Brackets>
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
                onClick={addWidget}
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
