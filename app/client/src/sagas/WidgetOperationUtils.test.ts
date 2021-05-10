import { get } from "lodash";
import {
  handleIfParentIsListWidgetWhilePasting,
  handleSpecificCasesWhilePasting,
  doesTriggerPathsContainPropertyPath,
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

  it("should returns widgets after executing handleIfParentIsListWidgetWhilePasting", async () => {
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
        items: [],
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
          items: [],
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
          items: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      },
    );

    expect(result.list1.template["Text1"].text).toStrictEqual(
      "{{List1.items.map((currentItem) => currentItem.text)}}",
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
        items: [],
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
          items: [],
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
          items: [],
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
          items: [],
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
          items: [],
          version: 16,
          disablePropertyPane: false,
          template: {},
        },
      ],
    );

    expect(result.list2.template["Text2"].text).toStrictEqual(
      "{{List2.items.map((currentItem) => currentItem.text)}}",
    );
    expect(get(result, "list2.dynamicBindingPathList.0.key")).toStrictEqual(
      "template.Text2.text",
    );
  });
});
