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
          key: "primaryColumns[0].verticalAlignment",
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
      dynamicTriggerPathList: [
        {
          key: "primaryColumns[4].onClick",
        },
      ],
      leftColumn: 0,
      dynamicBindingPathList: [
        {
          key: "primaryColumns[0].computedValue",
        },
        {
          key: "primaryColumns[1].computedValue",
        },
        {
          key: "primaryColumns[2].buttonLabel",
        },
        {
          key: "tableData",
        },
      ],
      primaryColumns: [
        {
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
        {
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
        {
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
      ],
      verticalAlignment: "CENTER",
    };
    const config = tablePropertyPaneConfig;

    const expected = {
      bindingPaths: {
        tableData: true,
        defaultSearchText: true,
        defaultSelectedRow: true,
        isVisible: true,
        "primaryColumns[0].computedValue": true,
        "primaryColumns[0].horizontalAlignment": true,
        "primaryColumns[0].verticalAlignment": true,
        "primaryColumns[0].textSize": true,
        "primaryColumns[0].fontStyle": true,
        "primaryColumns[0].textColor": true,
        "primaryColumns[0].cellBackground": true,
        "primaryColumns[1].inputFormat": true,
        "primaryColumns[1].outputFormat": true,
        "primaryColumns[1].computedValue": true,
        "primaryColumns[1].horizontalAlignment": true,
        "primaryColumns[1].verticalAlignment": true,
        "primaryColumns[1].textSize": true,
        "primaryColumns[1].fontStyle": true,
        "primaryColumns[1].textColor": true,
        "primaryColumns[1].cellBackground": true,
        "primaryColumns[2].buttonLabel": true,
        "primaryColumns[2].buttonStyle": true,
        "primaryColumns[2].buttonLabelColor": true,
      },
      triggerPaths: {
        onRowSelected: true,
        onPageChange: true,
        onSearchTextChanged: true,
        "primaryColumns[2].onClick": true,
      },
    };

    const result = getAllPathsFromPropertyConfig(widget, config);

    expect(result).toStrictEqual(expected);
  });
});
