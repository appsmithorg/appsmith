import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import setters from "../setters";
import TableWidget from "widgets/TableWidgetV2/widget";
import { CONFIG } from "widgets/TableWidgetV2/index";
import { RenderModes } from "constants/WidgetConstants";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { registerWidget } from "utils/WidgetRegisterHelpers";

registerWidget(TableWidget, CONFIG);

describe("Setter class test", () => {
  it("Setters init method ", () => {
    const evalTree: DataTree = {};
    const configTree: ConfigTree = {};

    const tableWidgetDataTree = generateDataTreeWidget({
      type: TableWidget.getWidgetType(),
      widgetId: "random",
      widgetName: "Table1",
      children: [],
      bottomRow: 0,
      isLoading: false,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      version: 1,
      leftColumn: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      primaryColumns: [],
    });

    evalTree["Table1"] = tableWidgetDataTree.unEvalEntity;
    configTree["Table1"] = tableWidgetDataTree.configEntity;

    setters.init(configTree);

    expect(setters.getMap()).toEqual({
      Table1: {
        setData: true,
        setSelectedRowIndex: true,
        setVisibility: true,
      },
    });
  });

  it("Setters  method ", async () => {
    const evalTree: DataTree = {};
    const configTree: ConfigTree = {};

    const tableWidgetDataTree = generateDataTreeWidget({
      type: TableWidget.getWidgetType(),
      widgetId: "random",
      widgetName: "Table1",
      children: [],
      bottomRow: 0,
      isLoading: false,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      version: 1,
      leftColumn: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      primaryColumns: [],
    });

    evalTree["Table1"] = tableWidgetDataTree.unEvalEntity;
    configTree["Table1"] = tableWidgetDataTree.configEntity;

    const methodMap = setters.getEntitySettersFromConfig(
      tableWidgetDataTree.configEntity,
      "Table1",
    );

    expect(Object.keys(methodMap)).toEqual([
      "setVisibility",
      "setSelectedRowIndex",
      "setData",
    ]);
  });
});
