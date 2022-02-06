import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";

describe("EntityDefinitions", () => {
  it("it tests list widget selectRow", () => {
    const listWidgetProps = {
      widgetId: "yolo",
      widgetName: "List1",
      parentId: "123",
      renderMode: "CANVAS",
      text: "yo",
      type: "INPUT_WIDGET_V2",
      parentColumnSpace: 1,
      parentRowSpace: 2,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      selectedItem: {
        id: 1,
        name: "Some random name",
      },
    };

    const listWidgetEntityDefinitions = entityDefinitions.LIST_WIDGET(
      listWidgetProps,
    );

    const output = {
      "!doc":
        "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
      "!url": "https://docs.appsmith.com/widget-reference/list",
      backgroundColor: {
        "!type": "string",
        "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
      },
      isVisible: {
        "!type": "bool",
        "!doc": "Boolean value indicating if the widget is in visible state",
      },
      selectedItem: { id: "number", name: "string" },
      gridGap: "number",
      items: "?",
      listData: "?",
      pageNo: "?",
      pageSize: "?",
    };

    expect(listWidgetEntityDefinitions).toStrictEqual(output);
  });
});
