import { getAllPathsFromPropertyConfig } from "./utils";
import { RenderModes } from "constants/WidgetConstants";
import tablePropertyPaneConfig from "widgets/TableWidget/widget/propertyConfig";
import {
  contentConfig,
  styleConfig,
} from "widgets/ChartWidget/widget/propertyConfig";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { ValidationTypes } from "constants/WidgetValidation";

describe("getAllPathsFromPropertyConfig", () => {
  it("works as expected for table widget", () => {
    const widget = {
      renderMode: RenderModes.CANVAS,
      derivedColumns: [],
      widgetName: "Table1",
      rightColumn: 8,
      textSize: "PARAGRAPH",
      columnOrder: ["name", "createdAt", "status"],
      dynamicPropertyPathList: [
        {
          key: "primaryColumns.name.verticalAlignment",
        },
      ],
      widgetId: "19ye491zn1",
      topRow: 7,
      bottomRow: 14,
      parentRowSpace: 40,
      tableData: "{{getUsers.data}}",
      isVisible: true,
      isVisibleDownload: true,
      label: "Data",
      searchKey: "",
      type: "TABLE_WIDGET",
      parentId: "0",
      isLoading: false,
      isSortable: true,
      horizontalAlignment: "LEFT",
      parentColumnSpace: 74,
      version: 1,
      dynamicTriggerPathList: [
        {
          key: "primaryColumns.status.onClick",
        },
      ],
      leftColumn: 0,
      dynamicBindingPathList: [
        {
          key: "primaryColumns.name.computedValue",
        },
        {
          key: "primaryColumns.createdAt.computedValue",
        },
        {
          key: "primaryColumns.status.buttonLabel",
        },
        {
          key: "tableData",
        },
      ],
      primaryColumns: {
        name: {
          index: 1,
          width: 150,
          id: "name",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "name",
          computedValue:
            "{{Table1.tableData.map((currentRow) => (currentRow.name))}}",
        },
        createdAt: {
          index: 2,
          width: 150,
          id: "createdAt",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "date",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "createdAt",
          computedValue:
            "{{Table1.tableData.map((currentRow) => (currentRow.createdAt))}}",
          inputFormat: "YYYY-MM-DDTHH:mm:ss",
          outputFormat: "DD-MM-YYYY",
        },
        status: {
          index: 4,
          width: 150,
          id: "status",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "button",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDisabled: false,
          isDerived: false,
          label: "status",
          computedValue:
            "{{Table1.tableData.map((currentRow) => (currentRow.status))}}",
          buttonLabel:
            "{{Table1.tableData.map((currentRow) => (currentRow.status))}}",
          onClick: "{{showAlert(currentRow.status)}}",
        },
      },
      verticalAlignment: "CENTER",
    };
    const config = tablePropertyPaneConfig;

    const result = getAllPathsFromPropertyConfig(widget, config, {
      selectedRow: true,
      selectedRows: true,
      tableData: true,
    });

    const expected = {
      reactivePaths: {
        selectedRow: EvaluationSubstitutionType.TEMPLATE,
        selectedRows: EvaluationSubstitutionType.TEMPLATE,
        tableData: "SMART_SUBSTITUTE",
        "primaryColumns.status.boxShadow": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.borderRadius":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonVariant":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonColor":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonLabel":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.isDisabled": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textColor":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.fontStyle":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textSize":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.outputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.inputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textColor": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.fontStyle": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textSize": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        primaryColumnId: EvaluationSubstitutionType.TEMPLATE,
        defaultSearchText: EvaluationSubstitutionType.TEMPLATE,
        defaultSelectedRow: EvaluationSubstitutionType.TEMPLATE,
        compactMode: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        isSortable: EvaluationSubstitutionType.TEMPLATE,
        isVisibleSearch: EvaluationSubstitutionType.TEMPLATE,
        isVisibleFilters: EvaluationSubstitutionType.TEMPLATE,
        isVisibleDownload: EvaluationSubstitutionType.TEMPLATE,
        isVisiblePagination: EvaluationSubstitutionType.TEMPLATE,
        delimiter: EvaluationSubstitutionType.TEMPLATE,
        cellBackground: EvaluationSubstitutionType.TEMPLATE,
        accentColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        textSize: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        boxShadow: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        "primaryColumns.status.onClick": true,
        onRowSelected: true,
        onPageChange: true,
        onPageSizeChange: true,
        onSearchTextChanged: true,
        onSort: true,
      },
      validationPaths: {
        tableData: { type: "OBJECT_ARRAY", params: { default: [] } },
        "primaryColumns.status.boxShadow": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.status.borderRadius": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.status.buttonVariant": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: {
              default: "PRIMARY",
              allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            },
          },
        },
        "primaryColumns.status.buttonColor": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { regex: /^(?![<|{{]).+/ },
          },
        },
        "primaryColumns.status.isDisabled": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: "BOOLEAN" },
        },
        "primaryColumns.status.isCellVisible": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: "BOOLEAN" },
        },
        "primaryColumns.createdAt.cellBackground": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { regex: /^(?![<|{{]).+/ },
          },
        },
        "primaryColumns.createdAt.textColor": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { regex: /^(?![<|{{]).+/ },
          },
        },
        "primaryColumns.createdAt.verticalAlignment": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { allowedValues: ["TOP", "CENTER", "BOTTOM"] },
          },
        },
        "primaryColumns.createdAt.fontStyle": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.createdAt.textSize": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.createdAt.horizontalAlignment": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { allowedValues: ["LEFT", "CENTER", "RIGHT"] },
          },
        },
        "primaryColumns.createdAt.outputFormat": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: [
                "Epoch",
                "Milliseconds",
                "YYYY-MM-DD",
                "YYYY-MM-DD HH:mm",
                "YYYY-MM-DDTHH:mm:ss.sssZ",
                "YYYY-MM-DDTHH:mm:ss",
                "YYYY-MM-DD hh:mm:ss",
                "Do MMM YYYY",
                "DD/MM/YYYY",
                "DD/MM/YYYY HH:mm",
                "LLL",
                "LL",
                "D MMMM, YYYY",
                "H:mm A D MMMM, YYYY",
                "MM-DD-YYYY",
                "DD-MM-YYYY",
                "MM/DD/YYYY",
                "DD/MM/YYYY",
                "DD/MM/YY",
                "MM/DD/YY",
              ],
            },
          },
        },
        "primaryColumns.createdAt.inputFormat": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: [
                "Epoch",
                "Milliseconds",
                "YYYY-MM-DD",
                "YYYY-MM-DD HH:mm",
                "YYYY-MM-DDTHH:mm:ss.sssZ",
                "YYYY-MM-DDTHH:mm:ss",
                "YYYY-MM-DD hh:mm:ss",
                "Do MMM YYYY",
                "DD/MM/YYYY",
                "DD/MM/YYYY HH:mm",
                "LLL",
                "LL",
                "D MMMM, YYYY",
                "H:mm A D MMMM, YYYY",
                "MM-DD-YYYY",
                "DD-MM-YYYY",
                "MM/DD/YYYY",
                "DD/MM/YYYY",
                "DD/MM/YY",
                "MM/DD/YY",
              ],
            },
          },
        },
        "primaryColumns.createdAt.isCellVisible": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: "BOOLEAN" },
        },
        "primaryColumns.name.cellBackground": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { regex: /^(?![<|{{]).+/ },
          },
        },
        "primaryColumns.name.textColor": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { regex: /^(?![<|{{]).+/ },
          },
        },
        "primaryColumns.name.verticalAlignment": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { allowedValues: ["TOP", "CENTER", "BOTTOM"] },
          },
        },
        "primaryColumns.name.fontStyle": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.name.textSize": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: ValidationTypes.TEXT },
        },
        "primaryColumns.name.horizontalAlignment": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: {
            type: ValidationTypes.TEXT,
            params: { allowedValues: ["LEFT", "CENTER", "RIGHT"] },
          },
        },
        "primaryColumns.name.isCellVisible": {
          type: ValidationTypes.TABLE_PROPERTY,
          params: { type: "BOOLEAN" },
        },
        primaryColumnId: { type: ValidationTypes.TEXT },
        defaultSearchText: { type: ValidationTypes.TEXT },
        defaultSelectedRow: {
          type: "FUNCTION",
          params: {
            expected: {
              type: "Index of row(s)",
              example: "0 | [0, 1]",
              autocompleteDataType: "STRING",
            },
          },
        },
        isVisible: { type: "BOOLEAN" },
        animateLoading: { type: "BOOLEAN" },
        isSortable: { type: "BOOLEAN", params: { default: true } },
        isVisibleSearch: { type: "BOOLEAN" },
        isVisibleFilters: { type: "BOOLEAN" },
        isVisibleDownload: { type: "BOOLEAN" },
        isVisiblePagination: { type: "BOOLEAN" },
        delimiter: { type: ValidationTypes.TEXT },
        cellBackground: { type: ValidationTypes.TEXT },
        accentColor: { type: ValidationTypes.TEXT },
        textColor: { type: ValidationTypes.TEXT },
        textSize: { type: ValidationTypes.TEXT },
        borderRadius: { type: ValidationTypes.TEXT },
        boxShadow: { type: ValidationTypes.TEXT },
      },
      bindingPaths: {
        tableData: "SMART_SUBSTITUTE",
        "primaryColumns.status.boxShadow": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.borderRadius":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonVariant":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonColor":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonLabel":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.isDisabled": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textColor":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.fontStyle":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textSize":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.outputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.inputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textColor": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.fontStyle": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textSize": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.isCellVisible":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        primaryColumnId: EvaluationSubstitutionType.TEMPLATE,
        defaultSearchText: EvaluationSubstitutionType.TEMPLATE,
        defaultSelectedRow: EvaluationSubstitutionType.TEMPLATE,
        compactMode: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        animateLoading: EvaluationSubstitutionType.TEMPLATE,
        isSortable: EvaluationSubstitutionType.TEMPLATE,
        isVisibleSearch: EvaluationSubstitutionType.TEMPLATE,
        isVisibleFilters: EvaluationSubstitutionType.TEMPLATE,
        isVisibleDownload: EvaluationSubstitutionType.TEMPLATE,
        isVisiblePagination: EvaluationSubstitutionType.TEMPLATE,
        delimiter: EvaluationSubstitutionType.TEMPLATE,
        cellBackground: EvaluationSubstitutionType.TEMPLATE,
        accentColor: EvaluationSubstitutionType.TEMPLATE,
        textColor: EvaluationSubstitutionType.TEMPLATE,
        textSize: EvaluationSubstitutionType.TEMPLATE,
        borderRadius: EvaluationSubstitutionType.TEMPLATE,
        boxShadow: EvaluationSubstitutionType.TEMPLATE,
      },
    };

    // Note: Removing until we figure out how functions are represented here.
    delete result.validationPaths.defaultSelectedRow.params?.fn;

    expect(result).toStrictEqual(expected);
  });
  it("works as expected for chart widget", () => {
    const widget = {
      renderMode: RenderModes.CANVAS,
      isVisible: true,
      widgetName: "Chart1",
      chartType: "LINE_CHART",
      chartName: "Sales on working days",
      allowScroll: false,
      version: 1,
      chartData: {
        "random-id": {
          seriesName: "",
          data: "{{Api1.data}}",
        },
      },
      xAxisName: "Last Week",
      yAxisName: "Total Order Revenue $",
      type: "CHART_WIDGET",
      isLoading: false,
      parentColumnSpace: 74,
      parentRowSpace: 40,
      leftColumn: 4,
      rightColumn: 10,
      topRow: 6,
      bottomRow: 14,
      parentId: "0",
      widgetId: "x1naz9is2b",
      dynamicBindingPathList: [
        {
          key: "chartData.random-id.data",
        },
      ],
      setAdaptiveYMin: "0",
    };
    const config = [...contentConfig, ...styleConfig];

    const bindingPaths = {
      chartType: EvaluationSubstitutionType.TEMPLATE,
      chartName: EvaluationSubstitutionType.TEMPLATE,
      "chartData.random-id.seriesName": EvaluationSubstitutionType.TEMPLATE,
      "chartData.random-id.data": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      xAxisName: EvaluationSubstitutionType.TEMPLATE,
      yAxisName: EvaluationSubstitutionType.TEMPLATE,
      isVisible: EvaluationSubstitutionType.TEMPLATE,
      animateLoading: EvaluationSubstitutionType.TEMPLATE,
      setAdaptiveYMin: EvaluationSubstitutionType.TEMPLATE,
      borderRadius: EvaluationSubstitutionType.TEMPLATE,
      boxShadow: EvaluationSubstitutionType.TEMPLATE,
    };

    const expected = {
      bindingPaths,
      reactivePaths: { ...bindingPaths },
      triggerPaths: {
        onDataPointClick: true,
      },
      validationPaths: {
        "chartData.random-id.data": {
          params: {
            children: {
              params: {
                required: true,
                allowedKeys: [
                  {
                    name: "x",
                    type: ValidationTypes.TEXT,
                    params: {
                      default: "",
                      required: true,
                    },
                  },
                  {
                    name: "y",
                    type: "NUMBER",
                    params: {
                      default: 10,
                      required: true,
                    },
                  },
                ],
              },
              type: "OBJECT",
            },
          },
          type: "ARRAY",
        },
        "chartData.random-id.seriesName": {
          type: ValidationTypes.TEXT,
        },
        chartName: {
          type: ValidationTypes.TEXT,
        },
        chartType: {
          params: {
            allowedValues: [
              "LINE_CHART",
              "BAR_CHART",
              "PIE_CHART",
              "COLUMN_CHART",
              "AREA_CHART",
              "CUSTOM_FUSION_CHART",
            ],
          },
          type: ValidationTypes.TEXT,
        },
        isVisible: {
          type: ValidationTypes.BOOLEAN,
        },
        animateLoading: {
          type: ValidationTypes.BOOLEAN,
        },
        setAdaptiveYMin: {
          type: ValidationTypes.BOOLEAN,
        },
        xAxisName: {
          type: ValidationTypes.TEXT,
        },
        yAxisName: {
          type: ValidationTypes.TEXT,
        },
        borderRadius: {
          type: ValidationTypes.TEXT,
        },
        boxShadow: {
          type: ValidationTypes.TEXT,
        },
      },
    };

    const result = getAllPathsFromPropertyConfig(widget, config, {
      "chartData.random-id.data": true,
    });

    expect(result).toStrictEqual(expected);
  });
});
