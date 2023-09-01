import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import setters from "../setters";
import TableWidget from "widgets/TableWidgetV2/widget";
import { CONFIG } from "widgets/TableWidgetV2/index";
import { RenderModes } from "constants/WidgetConstants";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { registerWidget } from "utils/WidgetRegisterHelpers";
import { createEvaluationContext } from "../evaluate";

registerWidget(TableWidget, CONFIG);

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
  tableData: [],
});

evalTree["Table1"] = tableWidgetDataTree.unEvalEntity;
configTree["Table1"] = tableWidgetDataTree.configEntity;

const evalContext = createEvaluationContext({
  dataTree: evalTree,
  isTriggerBased: true,
  context: {},
  configTree,
});

jest.mock("workers/Evaluation/handlers/evalTree", () => ({
  get dataTreeEvaluator() {
    return {
      evalTree: evalContext,
      getEvalTree: () => evalContext,
      getConfigTree: () => configTree,
    };
  },
}));

jest.mock("../evalTreeWithChanges", () => ({
  evalTreeWithChanges: () => {
    //
  },
}));

describe("Setter class test", () => {
  it("Setters init method ", () => {
    setters.init(configTree, evalTree);

    expect(setters.getMap()).toEqual({
      Table1: {
        setData: true,
        setSelectedRowIndex: true,
        setVisibility: true,
      },
    });
  });

  it("getEntitySettersFromConfig method ", async () => {
    const methodMap = setters.getEntitySettersFromConfig(
      tableWidgetDataTree.configEntity,
      "Table1",
      evalTree["Table1"],
    );

    const globalContext = self as any;

    Object.assign(globalContext, evalContext);

    expect(Object.keys(methodMap)).toEqual([
      "setVisibility",
      "setSelectedRowIndex",
      "setData",
    ]);

    globalContext.Table1.setVisibility(true);

    expect(globalContext.Table1.isVisible).toEqual(true);
  });
});
