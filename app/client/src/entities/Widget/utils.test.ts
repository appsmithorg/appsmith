import { getAllPathsFromPropertyConfig } from "./utils";
import { RenderModes, WidgetTypes } from "../../constants/WidgetConstants";
import tablePropertyPaneConfig from "widgets/TableWidget/TablePropertyPaneConfig";
import chartPorpertyConfig from "widgets/ChartWidget/propertyConfig";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

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
      label: "Data",
      searchKey: "",
      type: WidgetTypes.TABLE_WIDGET,
      parentId: "0",
      isLoading: false,
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

    const expected = {
      bindingPaths: {
        selectedRow: EvaluationSubstitutionType.TEMPLATE,
        selectedRows: EvaluationSubstitutionType.TEMPLATE,
        tableData: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        defaultPageSize: EvaluationSubstitutionType.TEMPLATE,
        defaultSearchText: EvaluationSubstitutionType.TEMPLATE,
        defaultSelectedRow: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textSize": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.fontStyle": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.textColor": EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.name.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.inputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.outputFormat":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.computedValue":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.horizontalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.verticalAlignment":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textSize":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.fontStyle":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.textColor":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.createdAt.cellBackground":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonLabel":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonStyle":
          EvaluationSubstitutionType.TEMPLATE,
        "primaryColumns.status.buttonLabelColor":
          EvaluationSubstitutionType.TEMPLATE,
        totalRecordsCount: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onRowSelected: true,
        onPageChange: true,
        onSearchTextChanged: true,
        onPageSizeChange: true,
        "primaryColumns.status.onClick": true,
      },
      validationPaths: {
        defaultPageSize: "NUMBER",
        defaultSearchText: "TEXT",
        defaultSelectedRow: "DEFAULT_SELECTED_ROW",
        isVisible: "BOOLEAN",
        tableData: "TABLE_DATA",
        totalRecordsCount: "NUMBER",
      },
    };

    const result = getAllPathsFromPropertyConfig(widget, config, {
      selectedRow: true,
      selectedRows: true,
    });

    expect(result).toStrictEqual(expected);
  });
  it("works as expected for chart widget", () => {
    const widget = {
      renderMode: RenderModes.CANVAS,
      isVisible: true,
      widgetName: "Chart1",
      chartType: "LINE_CHART",
      chartName: "Sales on working days",
      allowHorizontalScroll: false,
      version: 1,
      chartData: {
        "random-id": {
          seriesName: "",
          data: "{{Api1.data}}",
        },
      },
      xAxisName: "Last Week",
      yAxisName: "Total Order Revenue $",
      type: WidgetTypes.CHART_WIDGET,
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
    };
    const config = chartPorpertyConfig;

    const expected = {
      bindingPaths: {
        chartType: EvaluationSubstitutionType.TEMPLATE,
        chartName: EvaluationSubstitutionType.TEMPLATE,
        "chartData.random-id.seriesName": EvaluationSubstitutionType.TEMPLATE,
        "chartData.random-id.data": EvaluationSubstitutionType.SMART_SUBSTITUTE,
        xAxisName: EvaluationSubstitutionType.TEMPLATE,
        yAxisName: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onDataPointClick: true,
      },
      validationPaths: {
        "chartData.random-id.data": "CHART_SERIES_DATA",
        "chartData.random-id.seriesName": "TEXT",
        chartName: "TEXT",
        isVisible: "BOOLEAN",
        xAxisName: "TEXT",
        yAxisName: "TEXT",
      },
    };

    const result = getAllPathsFromPropertyConfig(widget, config, {});

    expect(result).toStrictEqual(expected);
  });
});
