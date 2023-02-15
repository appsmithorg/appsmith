import { jsVariableUpdates, getModifiedPaths } from "../JSVariableUpdates";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { VariableState, jsObjectCollection } from "../Collection";
import { updateEvalTreeWithJSCollectionState } from "..";

jest.mock("../../handlers/evalTree", () => {
  return {
    dataTreeEvaluator: {
      evalTree: {
        JSObject1: {
          var: {},
          var2: new Set([1, 2]),
          variables: ["var", "var2"],
          ENTITY_TYPE: "JSACTION",
        },
      },
    },
  };
});

describe("Mutation", () => {
  it("Global scope value mutation tracking", async () => {
    const dataTree = ({
      JSObject1: {
        var: {},
        var2: new Set([1, 2]),
        variables: ["var", "var2"],
        ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      },
    } as unknown) as DataTree;

    jsObjectCollection.setVariableState((dataTree as unknown) as VariableState);

    const evalContext = createEvaluationContext({
      dataTree,
      isTriggerBased: true,
      resolvedFunctions: {},
      skipEntityFunctions: true,
    });

    jsVariableUpdates.enable();

    Object.assign(self, evalContext);

    eval(`
    JSObject1.var = {};
    JSObject1.var.b = {};
    JSObject1.var.b.a = [];
    JSObject1.var.b.a.push(2);
    JSObject1.var2.add(3);
    `);

    jsVariableUpdates.disable();

    expect(jsVariableUpdates.getAll()).toEqual([
      { path: "JSObject1.var", method: "SET" },
      { path: "JSObject1.var.b", method: "SET" },
      { path: "JSObject1.var.b.a", method: "SET" },
      { path: "JSObject1.var.b.a", method: "PROTOTYPE_METHOD_CALL" },
      { path: "JSObject1.var2", method: "PROTOTYPE_METHOD_CALL" },
    ]);

    const modifiedVariablesList = getModifiedPaths(jsVariableUpdates.getAll());

    expect(modifiedVariablesList).toEqual([
      ["JSObject1", "var"],
      ["JSObject1", "var", "b"],
      ["JSObject1", "var", "b", "a"],
      ["JSObject1", "var", "b", "a"],
      ["JSObject1", "var2"],
    ]);
  });
});
