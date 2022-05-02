import reducer from "./pageWidgetsReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentRowBinding } from "widgets/TableWidget/constants";

const pageWidgetUIInitialState = {
  "60783f9204a08773573ed1d2": {
    "0": {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 1118,
      snapColumns: 16,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 1254,
      containerStyle: "none",
      snapRows: 33,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 16,
      minHeight: 1292,
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      children: ["i0zf1h4l5x", "qiyxmm887p"],
    },
    i0zf1h4l5x: {
      isVisible: true,
      label: "Data",
      widgetName: "Standup_Table",
      searchKey: "",
      textSize: "PARAGRAPH",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      primaryColumns: {
        avatar: {
          index: 0,
          width: 150,
          id: "avatar",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "image",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "avatar",
          computedValue: getCurrentRowBinding(
            "Standup_Table",
            "currentRow.avatar",
          ),
          outputFormat: "",
        },
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
          computedValue: getCurrentRowBinding(
            "Standup_Table",
            "currentRow.name",
          ),
        },
        notes: {
          index: 2,
          width: 150,
          id: "notes",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isDerived: false,
          label: "notes",
          computedValue: getCurrentRowBinding(
            "Standup_Table",
            "currentRow.notes",
          ),
        },
      },
      derivedColumns: {},
      tableData: "{{fetch_standup_updates.data}}",
      version: 1,
      type: "TABLE_WIDGET",
      isLoading: false,
      parentColumnSpace: 1,
      parentRowSpace: 40,
      leftColumn: 0,
      rightColumn: 16,
      topRow: 2,
      bottomRow: 17,
      parentId: "0",
      widgetId: "i0zf1h4l5x",
      columnSizeMap: {
        avatar: 20,
        name: 30,
      },
      migrated: true,
      columns: 16,
      rows: 15,
      dynamicBindingPathList: [
        {
          key: "tableData",
        },
        {
          key: "primaryColumns.avatar.computedValue",
        },
        {
          key: "primaryColumns.name.computedValue",
        },
        {
          key: "primaryColumns.notes.computedValue",
        },
      ],
      dynamicTriggerPathList: [],
      columnTypeMap: {
        avatar: {
          type: "image",
          format: "",
        },
      },
      columnOrder: ["avatar", "name", "notes"],
    },
    qiyxmm887p: {
      isVisible: true,
      inputType: "TEXT",
      label: "",
      widgetName: "Standup_Input",
      version: 1,
      resetOnSubmit: true,
      placeholderText: "Type your update and hit enter!",
      type: "INPUT_WIDGET_V2",
      isLoading: false,
      leftColumn: 5,
      rightColumn: 11,
      topRow: 1,
      bottomRow: 2,
      parentId: "0",
      widgetId: "qiyxmm887p",
      onSubmit:
        "{{add_standup_updates.run(() => fetch_standup_updates.run(), () => {})}}",
      dynamicBindingPathList: [],
      dynamicTriggerPathList: [
        {
          key: "onSubmit",
        },
      ],
    },
  },
};

describe("page widget reducer test", () => {
  it("should remove page widgets from state", () => {
    expect(
      reducer(pageWidgetUIInitialState, {
        type: ReduxActionTypes.RESET_APPLICATION_WIDGET_STATE_REQUEST,
        payload: {},
      }),
    ).toEqual({});
  });
});
