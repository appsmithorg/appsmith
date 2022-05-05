import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { RenderModes } from "constants/WidgetConstants";
import { get } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  handleIfParentIsListWidgetWhilePasting,
  handleSpecificCasesWhilePasting,
  doesTriggerPathsContainPropertyPath,
  getSelectedWidgetIfPastingIntoListWidget,
  checkIfPastingListWidgetOntoItself,
  updateListWidgetPropertiesOnChildDelete,
  purgeOrphanedDynamicPaths,
  getBoundariesFromSelectedWidgets,
  getSnappedGrid,
  changeIdsOfPastePositions,
  getVerticallyAdjustedPositions,
  getNewPositionsForCopiedWidgets,
  CopiedWidgetGroup,
  getPastePositionMapFromMousePointer,
  getReflowedPositions,
  getWidgetsFromIds,
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

  it("should returns widgets after executing getSelectedWidgetIfPastingIntoListWidget", async () => {
    const result = getSelectedWidgetIfPastingIntoListWidget(
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
  it("should return boundaries of selected Widgets", () => {
    const selectedWidgets = ([
      {
        id: "1234",
        topRow: 10,
        leftColumn: 20,
        rightColumn: 45,
        bottomRow: 40,
      },
      {
        id: "1233",
        topRow: 45,
        leftColumn: 30,
        rightColumn: 60,
        bottomRow: 70,
      },
    ] as any) as WidgetProps[];
    expect(getBoundariesFromSelectedWidgets(selectedWidgets)).toEqual({
      totalWidth: 40,
      maxThickness: 30,
      topMostRow: 10,
      leftMostColumn: 20,
    });
  });
  describe("test getSnappedGrid", () => {
    it("should return snapGrids for a ContainerWidget", () => {
      const canvasWidget = ({
        widgetId: "1234",
        type: "CONTAINER_WIDGET",
        noPad: true,
      } as any) as WidgetProps;
      expect(getSnappedGrid(canvasWidget, 250)).toEqual({
        padding: 4,
        snapGrid: {
          snapColumnSpace: 3.78125,
          snapRowSpace: 10,
        },
      });
    });
    it("should return snapGrids for non ContainerWidget", () => {
      const canvasWidget = ({
        widgetId: "1234",
        type: "LIST_WIDGET",
        noPad: false,
      } as any) as WidgetProps;
      expect(getSnappedGrid(canvasWidget, 250)).toEqual({
        padding: 10,
        snapGrid: {
          snapColumnSpace: 3.59375,
          snapRowSpace: 10,
        },
      });
    });
  });
  it("should test changeIdsOfPastePositions", () => {
    const newPastingPositionMap = {
      "1234": {
        id: "1234",
        left: 10,
        right: 20,
        top: 10,
        bottom: 20,
      },
      "1235": {
        id: "1235",
        left: 11,
        right: 22,
        top: 11,
        bottom: 22,
      },
    };
    expect(changeIdsOfPastePositions(newPastingPositionMap)).toEqual([
      {
        id: "1",
        left: 10,
        right: 20,
        top: 10,
        bottom: 20,
      },
      {
        id: "2",
        left: 11,
        right: 22,
        top: 11,
        bottom: 22,
      },
    ]);
  });

  it("should offset widgets vertically so that it doesn't overlap with selected widgets", () => {
    const selectedWidgets = [
      {
        id: "1234",
        top: 10,
        left: 20,
        right: 45,
        bottom: 40,
      },
      {
        id: "1233",
        top: 45,
        left: 30,
        right: 60,
        bottom: 70,
      },
      {
        id: "1235",
        topRow: 80,
        left: 10,
        right: 50,
        bottom: 100,
      },
    ] as OccupiedSpace[];
    const copiedWidgets = ([
      {
        id: "1234",
        top: 10,
        left: 20,
        right: 45,
        bottom: 40,
      },
      {
        id: "1233",
        top: 45,
        left: 30,
        right: 60,
        bottom: 70,
      },
    ] as any) as OccupiedSpace[];
    expect(
      getVerticallyAdjustedPositions(copiedWidgets, selectedWidgets, 30),
    ).toEqual({
      "1234": {
        id: "1234",
        top: 71,
        left: 20,
        right: 45,
        bottom: 101,
      },
      "1233": {
        id: "1233",
        top: 106,
        left: 30,
        right: 60,
        bottom: 131,
      },
    });
  });
  it("should test getNewPositionsForCopiedWidgets", () => {
    const copiedGroups = ([
      {
        widgetId: "1234",
        list: [
          {
            topRow: 10,
            leftColumn: 20,
            rightColumn: 45,
            bottomRow: 40,
          },
        ],
      },
      {
        widgetId: "1235",
        list: [
          {
            topRow: 45,
            leftColumn: 25,
            rightColumn: 40,
            bottomRow: 80,
          },
        ],
      },
    ] as any) as CopiedWidgetGroup[];
    expect(
      getNewPositionsForCopiedWidgets(copiedGroups, 10, 40, 20, 10),
    ).toEqual([
      {
        id: "1234",
        top: 40,
        left: 10,
        right: 35,
        bottom: 70,
      },
      {
        id: "1235",
        top: 75,
        left: 15,
        right: 30,
        bottom: 110,
      },
    ]);
  });
  it("should test getPastePositionMapFromMousePointer", () => {
    const copiedGroups = ([
      {
        widgetId: "1234",
        list: [
          {
            topRow: 10,
            leftColumn: 20,
            rightColumn: 45,
            bottomRow: 40,
          },
        ],
      },
      {
        widgetId: "1235",
        list: [
          {
            topRow: 45,
            leftColumn: 25,
            rightColumn: 40,
            bottomRow: 80,
          },
        ],
      },
    ] as any) as CopiedWidgetGroup[];
    expect(
      getPastePositionMapFromMousePointer(copiedGroups, 10, 40, 20, 10),
    ).toEqual({
      "1234": {
        id: "1234",
        top: 40,
        left: 10,
        right: 35,
        bottom: 70,
      },
      "1235": {
        id: "1235",
        top: 75,
        left: 15,
        right: 30,
        bottom: 110,
      },
    });
  });
  it("should test getReflowedPositions", () => {
    const widgets = {
      "1234": {
        widgetId: "1234",
        topRow: 40,
        leftColumn: 10,
        rightColumn: 35,
        bottomRow: 70,
      } as FlattenedWidgetProps,
      "1233": {
        widgetId: "1233",
        topRow: 45,
        leftColumn: 30,
        rightColumn: 60,
        bottomRow: 70,
      } as FlattenedWidgetProps,
      "1235": {
        widgetId: "1235",
        topRow: 75,
        leftColumn: 15,
        rightColumn: 30,
        bottomRow: 110,
      } as FlattenedWidgetProps,
    };

    const gridProps = {
      parentRowSpace: 10,
      parentColumnSpace: 10,
      maxGridColumns: 64,
    };

    const reflowingWidgets = {
      "1234": {
        X: 30,
        width: 200,
      },
      "1235": {
        X: 40,
        width: 250,
        Y: 50,
        height: 250,
      },
    };

    expect(getReflowedPositions(widgets, gridProps, reflowingWidgets)).toEqual({
      "1234": {
        widgetId: "1234",
        topRow: 40,
        leftColumn: 13,
        rightColumn: 33,
        bottomRow: 70,
      },
      "1233": {
        widgetId: "1233",
        topRow: 45,
        leftColumn: 30,
        rightColumn: 60,
        bottomRow: 70,
      },
      "1235": {
        widgetId: "1235",
        topRow: 80,
        leftColumn: 19,
        rightColumn: 44,
        bottomRow: 105,
      },
    });
  });
  it("should test getWidgetsFromIds", () => {
    const widgets = {
      "1234": {
        widgetId: "1234",
        topRow: 40,
        leftColumn: 10,
        rightColumn: 35,
        bottomRow: 70,
      } as FlattenedWidgetProps,
      "1233": {
        widgetId: "1233",
        topRow: 45,
        leftColumn: 30,
        rightColumn: 60,
        bottomRow: 70,
      } as FlattenedWidgetProps,
      "1235": {
        widgetId: "1235",
        topRow: 75,
        leftColumn: 15,
        rightColumn: 30,
        bottomRow: 110,
      } as FlattenedWidgetProps,
    };
    expect(getWidgetsFromIds(["1235", "1234", "1237"], widgets)).toEqual([
      {
        widgetId: "1235",
        topRow: 75,
        leftColumn: 15,
        rightColumn: 30,
        bottomRow: 110,
      },
      {
        widgetId: "1234",
        topRow: 40,
        leftColumn: 10,
        rightColumn: 35,
        bottomRow: 70,
      },
    ]);
  });
  it("should test checkIfPastingListWidgetOntoItself", () => {
    const canvasWidgets = {
      list2: {
        widgetId: "list2",
        type: "LIST_WIDGET",
        widgetName: "List2",
        parentId: "0",
        renderMode: RenderModes.CANVAS,
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
        children: [],
      },
    };
    const selectedWidget = {
      widgetId: "list2",
      type: "LIST_WIDGET",
      widgetName: "List2",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
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
      children: [],
    };
    //if copying list widget onto list widget
    expect(
      checkIfPastingListWidgetOntoItself(canvasWidgets, selectedWidget, [
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
      ]),
    ).toBe(true);

    //if copying container widget onto list widget
    expect(
      checkIfPastingListWidgetOntoItself(canvasWidgets, selectedWidget, [
        {
          widgetId: "container",
          parentId: "0",
          list: [
            {
              widgetId: "container",
              type: "CONTAINER_WIDGET",
              widgetName: "container",
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
      ]),
    ).toBe(false);
  });
});
