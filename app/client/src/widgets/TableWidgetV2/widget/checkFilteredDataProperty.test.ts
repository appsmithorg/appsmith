import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import type {
    DataTreeEntityObject,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";

import TableWidget from "widgets/TableWidgetV2";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import type { TableWidgetProps } from "../constants";
import type { batchUpdateWidgetMetaPropertyType, DebouncedExecuteActionPayload } from "widgets/MetaHOC";
describe("Bug: check filteredTableData property in autocomplete definitions of table widget", () => {
    it("check filteredTableData property", () => {
      registerWidgets([TableWidget]);
      const tableWidgetProps:TableWidgetProps={
          pristine: false,
          label: "data",
          searchText: "",
          type: "TABLE_WIDGET_V2",
          defaultSearchText: "",
          tableData: [
            {
                "id": 1,
                "name": "pavan"
            },
            {
                "id": 2,
                "name": "anil"
            },
            {
                "id": 3,
                "name": "radha"
            }
        ],
          pageSize: 0,
          onSearchTextChanged: "",
          onSort: "",
          selectedRowIndices: [],
          frozenColumnIndices: {
            "id":1
          },
          primaryColumns: {
            id:{
                "allowCellWrapping": false,
                "allowSameOptionsInNewRow": true,
                "index": 0,
                "width": 150,
                "originalId": "id",
                "id": "id",
                "alias": "id",
                "horizontalAlignment": "LEFT",
                "verticalAlignment": "CENTER",
                "columnType": "number",
                "textSize": "0.875rem",
                "enableFilter": true,
                "enableSort": true,
                "isVisible": true,
                "isDisabled": false,
                "isCellEditable": false,
                "isEditable": false,
                "isCellVisible": true,
                "isDerived": false,
                "label": "id",
                "isSaveVisible": true,
                "isDiscardVisible": true,
                "validation": {},
                "currencyCode": "USD",
                "decimals": 0,
                "thousandSeparator": true,
                "notation": "standard",
                "fontStyle": "",
                "cellBackground": "",
                "textColor": "",
                computedValue: ""
            }
          },
          derivedColumns: {
            id:{
                id: "",
                originalId: "",
                columnType: "",
                isVisible: false,
                index: 0,
                isDerived: false,
                computedValue: "",
                alias: "",
                allowCellWrapping: false,
                width: 0,
                isCellEditable: false,
                isEditable: false
            }
          },
          sortOrder: {
              column: "",
              order: null
          },
          transientTableData: {},
          primaryColor: "",
          borderRadius: "",
          isEditableCellsValid: {},
          isAddRowInProgress: false,
          newRow: {},
          firstEditableColumnIdByOrder: "",
          enableServerSideFiltering: false,
          onTableFilterUpdate: "",
          hoverValue: "",
          onHoverTable: "",
          widgetId: "",
          widgetName: "",
          renderMode: "CANVAS",
          version: 0,
          parentColumnSpace: 0,
          parentRowSpace: 0,
          leftColumn: 0,
          rightColumn: 0,
          topRow: 0,
          bottomRow: 0,
          isLoading: false,
          commitBatchMetaUpdates: function (): void {
              throw new Error("Function not implemented.");
          },
          pushBatchMetaUpdates: function (propertyName: string | batchUpdateWidgetMetaPropertyType, propertyValue?: unknown, actionExecution?: DebouncedExecuteActionPayload | undefined): void {
              throw new Error("Function not implemented.");
          },
          updateWidgetMetaProperty: function (propertyName: string, propertyValue: unknown, actionExecution?: DebouncedExecuteActionPayload | undefined): void {
              throw new Error("Function not implemented.");
          },
          allowAddNewRow: false,
          onAddNewRowSave: "",
          onAddNewRowDiscard: "",
          defaultNewRow: {},
          "filteredTableData": [
        {
            "id": 1,
            "name": "pavan",
            "__originalIndex__": 0,
            "__primaryKey__": 1,
            "EditActions1": ""
        },
        {
            "id": 2,
            "name": "anil",
            "__originalIndex__": 1,
            "__primaryKey__": 2,
            "EditActions1": ""
        },
        {
            "id": 3,
            "name": "radha",
            "__originalIndex__": 2,
            "__primaryKey__": 3,
            "EditActions1": ""
        }
    ],
      }
      const dataTreeEntity: DataTreeEntityObject = {
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
        meta: {},
        ...tableWidgetProps
        
      };
      const dataTreeEntityConfig: WidgetEntityConfig = {
        bindingPaths: {
          defaultText: EvaluationSubstitutionType.TEMPLATE,
        },
        reactivePaths: {
          defaultText: EvaluationSubstitutionType.TEMPLATE,
        },
        triggerPaths: {
          onTextChange: true,
        },
        validationPaths: {},
        logBlackList: {},
        propertyOverrideDependency: {},
        overridingPropertyPaths: {},
        privateWidgets: {},
        defaultMetaProps: [],
        widgetId: "yolo",
        widgetName: "Table1",
        type: "TABLE_WIDGET_V2",
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      };
      const { def, entityInfo } = dataTreeTypeDefCreator(
        {
          Table1: dataTreeEntity,
        },
        {},
        dataTreeEntityConfig,
      );

      expect(def).toHaveProperty("Table1.filteredTableData");
      expect(entityInfo.get("Table1")).toStrictEqual({
        type: ENTITY_TYPE.WIDGET,
        subType: "TABLE_WIDGET_V2",
      });
    });
});  