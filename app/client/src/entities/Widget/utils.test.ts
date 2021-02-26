import { getAllPathsFromPropertyConfig } from "./utils";
import { RenderModes, WidgetTypes } from "../../constants/WidgetConstants";
import tablePropertyPaneConfig from "widgets/TableWidget/TablePropertyPaneConfig";

describe("getAllPathsFromPropertyConfig", () => {
  it("works as expected", () => {
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
        selectedRow: true,
        selectedRows: true,
        tableData: true,
        defaultSearchText: true,
        defaultSelectedRow: true,
        isVisible: true,
        "primaryColumns.name.computedValue": true,
        "primaryColumns.name.horizontalAlignment": true,
        "primaryColumns.name.verticalAlignment": true,
        "primaryColumns.name.textSize": true,
        "primaryColumns.name.fontStyle": true,
        "primaryColumns.name.textColor": true,
        "primaryColumns.name.cellBackground": true,
        "primaryColumns.createdAt.inputFormat": true,
        "primaryColumns.createdAt.outputFormat": true,
        "primaryColumns.createdAt.computedValue": true,
        "primaryColumns.createdAt.horizontalAlignment": true,
        "primaryColumns.createdAt.verticalAlignment": true,
        "primaryColumns.createdAt.textSize": true,
        "primaryColumns.createdAt.fontStyle": true,
        "primaryColumns.createdAt.textColor": true,
        "primaryColumns.createdAt.cellBackground": true,
        "primaryColumns.status.buttonLabel": true,
        "primaryColumns.status.buttonStyle": true,
        "primaryColumns.status.buttonLabelColor": true,
      },
      triggerPaths: {
        onRowSelected: true,
        onPageChange: true,
        onSearchTextChanged: true,
        onPageSizeChange: true,
        "primaryColumns.status.onClick": true,
      },
    };

    const result = getAllPathsFromPropertyConfig(widget, config, {
      selectedRow: true,
      selectedRows: true,
    });

    expect(result).toStrictEqual(expected);
  });
});
