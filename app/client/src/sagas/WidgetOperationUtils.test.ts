import { get } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import {
  handleIfParentIsListWidgetWhilePasting,
  handleSpecificCasesWhilePasting,
  doesTriggerPathsContainPropertyPath,
  checkIfPastingIntoListWidget,
  updateListWidgetPropertiesOnChildDelete,
  purgeOrphanedDynamicPaths,
} from "./WidgetOperationUtils";

describe("WidgetOperationSaga", () => {
  it("should returns widgets after executing handleIfParentIsListWidgetWhilePasting", async () => {
    expect(
      doesTriggerPathsContainPropertyPath(false, "trigger-path-1", [
        "trigger-path-1",
      ]),
    ).toBe(true);

    expect(
      doesTriggerPathsContainPropertyPath(false, "trigger-path-1", [
        "trigger-path-2",
      ]),
    ).toBe(false);

    expect(
      doesTriggerPathsContainPropertyPath(true, "trigger-path-1", [
        "trigger-path-2",
      ]),
    ).toBe(true);
  });

  it("should return widgets after executing handleIfParentIsListWidgetWhilePasting", async () => {
    const result = handleIfParentIsListWidgetWhilePasting(
      {
        widgetId: "text1",
        type: "TEXT_WIDGET",
        widgetName: "Text1",
        parentId: "list1",
        renderMode: "CANVAS",
        parentColumnSpace: 2,
        parentRowSpace: 3,
        leftColumn: 2,
        rightColumn: 3,
        topRow: 1,
        bottomRow: 3,
        isLoading: false,
        listData: [],
        text: "{{currentItem.text}}",
        version: 16,
        disablePropertyPane: false,
      },
      {
        list1: {
          widgetId: "list1",
          type: "LIST_WIDGET",
          widgetName: "List1",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
        0: {
          image: "",
          defaultImage: "",
          widgetId: "0",
          type: "CANVAS_WIDGET",
          widgetName: "MainContainer",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      },
    );

    expect(result.list1.template["Text1"].text).toStrictEqual(
      "{{List1.listData.map((currentItem) => currentItem.text)}}",
    );
    expect(get(result, "list1.dynamicBindingPathList.0.key")).toStrictEqual(
      "template.Text1.text",
    );
  });

  it("should returns widgets after executing handleSpecificCasesWhilePasting", async () => {
    const result = handleSpecificCasesWhilePasting(
      {
        widgetId: "text2",
        type: "TEXT_WIDGET",
        widgetName: "Text2",
        parentId: "list2",
        renderMode: "CANVAS",
        parentColumnSpace: 2,
        parentRowSpace: 3,
        leftColumn: 2,
        rightColumn: 3,
        topRow: 1,
        bottomRow: 3,
        isLoading: false,
        listData: [],
        text: "{{currentItem.text}}",
        version: 16,
        disablePropertyPane: false,
      },
      {
        list1: {
          widgetId: "list1",
          type: "LIST_WIDGET",
          widgetName: "List1",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
        0: {
          image: "",
          defaultImage: "",
          widgetId: "0",
          type: "CANVAS_WIDGET",
          widgetName: "MainContainer",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
        list2: {
          widgetId: "list2",
          type: "LIST_WIDGET",
          widgetName: "List2",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      },
      {
        List1: "List2",
      },
      [
        {
          widgetId: "list2",
          type: "LIST_WIDGET",
          widgetName: "List2",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      ],
    );

    expect(result.list2.template["Text2"].text).toStrictEqual(
      "{{List2.listData.map((currentItem) => currentItem.text)}}",
    );
    expect(get(result, "list2.dynamicBindingPathList.0.key")).toStrictEqual(
      "template.Text2.text",
    );
  });

  it("should return correct close modal reference name after executing handleSpecificCasesWhilePasting", async () => {
    const result = handleSpecificCasesWhilePasting(
      {
        widgetName: "Modal1Copy",
        rightColumn: 24,
        detachFromLayout: true,
        widgetId: "k441huwm77",
        topRow: 34,
        bottomRow: 58,
        parentRowSpace: 10,
        canOutsideClickClose: true,
        type: "MODAL_WIDGET",
        canEscapeKeyClose: true,
        version: 1,
        parentId: "0",
        shouldScrollContents: true,
        isLoading: false,
        parentColumnSpace: 17.21875,
        size: "MODAL_SMALL",
        leftColumn: 0,
        children: ["ihxw5r23hd"],
        renderMode: "CANVAS",
      },
      {
        k441huwm77: {
          widgetName: "Modal1Copy",
          rightColumn: 24,
          detachFromLayout: true,
          widgetId: "k441huwm77",
          topRow: 34,
          bottomRow: 58,
          parentRowSpace: 10,
          canOutsideClickClose: true,
          type: "MODAL_WIDGET",
          canEscapeKeyClose: true,
          version: 1,
          parentId: "0",
          shouldScrollContents: true,
          isLoading: false,
          parentColumnSpace: 17.21875,
          size: "MODAL_SMALL",
          leftColumn: 0,
          children: ["ihxw5r23hd"],
          renderMode: "CANVAS",
        },
        suhkuyfpk3: {
          widgetName: "Icon1Copy",
          rightColumn: 64,
          onClick: "{{closeModal('Modal1')}}",
          color: "#040627",
          iconName: "cross",
          widgetId: "suhkuyfpk3",
          topRow: 1,
          bottomRow: 5,
          isVisible: true,
          type: "ICON_WIDGET",
          version: 1,
          parentId: "ihxw5r23hd",
          isLoading: false,
          leftColumn: 56,
          iconSize: 24,
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
        },
        twnxjwy3r1: {
          widgetName: "Button1Copy",
          rightColumn: 48,
          onClick: "{{closeModal('Modal1')}}",
          isDefaultClickDisabled: true,
          widgetId: "twnxjwy3r1",
          buttonStyle: "SECONDARY_BUTTON",
          topRow: 16,
          bottomRow: 20,
          isVisible: true,
          type: "BUTTON_WIDGET",
          version: 1,
          parentId: "ihxw5r23hd",
          isLoading: false,
          dynamicTriggerPathList: [
            {
              key: "onClick",
            },
          ],
          leftColumn: 36,
          dynamicBindingPathList: [],
          text: "Cancel",
          isDisabled: false,
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
        },
      },
      {
        Modal1: "Modal1Copy",
        Canvas1: "Canvas1Copy",
        Icon1: "Icon1Copy",
        Text1: "Text1Copy",
        Button1: "Button1Copy",
        Button2: "Button2Copy",
      },
      [
        {
          widgetName: "Modal1Copy",
          rightColumn: 24,
          detachFromLayout: true,
          widgetId: "k441huwm77",
          topRow: 34,
          bottomRow: 58,
          parentRowSpace: 10,
          canOutsideClickClose: true,
          type: "MODAL_WIDGET",
          canEscapeKeyClose: true,
          version: 1,
          parentId: "0",
          shouldScrollContents: true,
          isLoading: false,
          parentColumnSpace: 17.21875,
          size: "MODAL_SMALL",
          leftColumn: 0,
          children: ["ihxw5r23hd"],
          renderMode: "CANVAS",
        },
        {
          widgetName: "Icon1Copy",
          rightColumn: 64,
          onClick: "{{closeModal('Modal1')}}",
          color: "#040627",
          iconName: "cross",
          widgetId: "suhkuyfpk3",
          topRow: 1,
          bottomRow: 5,
          isVisible: true,
          type: "ICON_WIDGET",
          version: 1,
          parentId: "ihxw5r23hd",
          isLoading: false,
          leftColumn: 56,
          iconSize: 24,
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
        },
        {
          widgetName: "Button1Copy",
          rightColumn: 48,
          onClick: "{{closeModal('Modal1')}}",
          isDefaultClickDisabled: true,
          widgetId: "twnxjwy3r1",
          buttonStyle: "SECONDARY_BUTTON",
          topRow: 16,
          bottomRow: 20,
          isVisible: true,
          type: "BUTTON_WIDGET",
          version: 1,
          parentId: "ihxw5r23hd",
          isLoading: false,
          dynamicTriggerPathList: [
            {
              key: "onClick",
            },
          ],
          leftColumn: 36,
          dynamicBindingPathList: [],
          text: "Cancel",
          isDisabled: false,
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
        },
      ],
    );
    expect(result["suhkuyfpk3"].onClick).toStrictEqual(
      "{{closeModal('Modal1Copy')}}",
    );
    expect(result["twnxjwy3r1"].onClick).toStrictEqual(
      "{{closeModal('Modal1Copy')}}",
    );
  });

  it("should returns widgets after executing checkIfPastingIntoListWidget", async () => {
    const result = checkIfPastingIntoListWidget(
      {
        list2: {
          widgetId: "list2",
          type: "LIST_WIDGET",
          widgetName: "List2",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      },
      {
        widgetId: "list2",
        type: "LIST_WIDGET",
        widgetName: "List2",
        parentId: "0",
        renderMode: "CANVAS",
        parentColumnSpace: 2,
        parentRowSpace: 3,
        leftColumn: 2,
        rightColumn: 3,
        topRow: 1,
        bottomRow: 3,
        isLoading: false,
        listData: [],
        version: 16,
        disablePropertyPane: false,
        template: {},
      },
      [
        {
          widgetId: "list2",
          parentId: "0",
          list: [
            {
              widgetId: "list2",
              type: "LIST_WIDGET",
              widgetName: "List2",
              parentId: "0",
              renderMode: "CANVAS",
              parentColumnSpace: 2,
              parentRowSpace: 3,
              leftColumn: 2,
              rightColumn: 3,
              topRow: 1,
              bottomRow: 3,
              isLoading: false,
              listData: [],
              version: 16,
              disablePropertyPane: false,
              template: {},
            },
          ],
        },
      ],
    );

    expect(result?.type).toStrictEqual("LIST_WIDGET");
  });

  it("should return widgets after executing updateListWidgetPropertiesOnChildDelete", () => {
    const result = updateListWidgetPropertiesOnChildDelete(
      {
        list1: {
          widgetId: "list1",
          type: "LIST_WIDGET",
          widgetName: "List1",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
          enhancements: {},
          dynamicBindingPathList: [{ key: "template.ButtonWidget1.text" }],
          dynamicTriggerPathList: [
            {
              key: "template.ButtonWidget1.onClick",
            },
          ],
        },
        buttonWidget1: {
          type: "BUTTON_WIDGET",
          widgetId: "buttonWidget1",
          widgetName: "buttonWidget1",
          version: 16,
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          renderMode: "CANVAS",
          isLoading: false,
          parentId: "list1",
        },
        0: {
          type: "CANVAS_WIDGET",
          widgetId: "0",
          widgetName: "MainContainer",
          version: 16,
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          renderMode: "CANVAS",
          isLoading: false,
          parentId: "list1",
        },
      },
      "buttonWidget1",
      "ButtonWidget1",
    );

    const expected = updateListWidgetPropertiesOnChildDelete(
      {
        list1: {
          widgetId: "list1",
          type: "LIST_WIDGET",
          widgetName: "List1",
          parentId: "0",
          renderMode: "CANVAS",
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          isLoading: false,
          listData: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
          enhancements: {},
          dynamicBindingPathList: [],
          dynamicTriggerPathList: [],
        },
        buttonWidget1: {
          type: "BUTTON_WIDGET",
          widgetId: "buttonWidget1",
          widgetName: "buttonWidget1",
          version: 16,
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          renderMode: "CANVAS",
          isLoading: false,
          parentId: "list1",
        },
        0: {
          type: "CANVAS_WIDGET",
          widgetId: "0",
          widgetName: "MainContainer",
          version: 16,
          parentColumnSpace: 2,
          parentRowSpace: 3,
          leftColumn: 2,
          rightColumn: 3,
          topRow: 1,
          bottomRow: 3,
          renderMode: "CANVAS",
          isLoading: false,
          parentId: "list1",
        },
      },
      "buttonWidget1",
      "ButtonWidget1",
    );

    expect(result).toStrictEqual(expected);
  });

  it("should purge orphaned dynamicTriggerPaths and dynamicBindingPaths from widget", () => {
    const input = {
      dynamicBindingPathList: [
        { key: "primaryColumns.name.computedValue" },
        { key: "primaryColumns.name.fontStyle" },
        { key: "primaryColumns.name.nonExistentPath" },
        { key: "nonExistentKey" },
      ],
      dynamicTriggerPathList: [
        { key: "primaryColumns.name.onClick" },
        { key: "primaryColumns.name.nonExistentPath" },
        { key: "nonExistentKey" },
      ],
      primaryColumns: {
        name: {
          computedValue: "{{currentRow.something}}",
          fontStyle: "bold",
          onClick: "{{showAlert('message', 'error')}}",
        },
      },
    };
    const expected = {
      dynamicBindingPathList: [
        { key: "primaryColumns.name.computedValue" },
        { key: "primaryColumns.name.fontStyle" },
      ],
      dynamicTriggerPathList: [{ key: "primaryColumns.name.onClick" }],
      primaryColumns: {
        name: {
          computedValue: "{{currentRow.something}}",
          fontStyle: "bold",
          onClick: "{{showAlert('message', 'error')}}",
        },
      },
    };
    const result = purgeOrphanedDynamicPaths((input as any) as WidgetProps);
    expect(result).toStrictEqual(expected);
  });
});
