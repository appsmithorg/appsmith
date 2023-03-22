import JSVariableUpdates, { getUpdatedPaths } from "../JSVariableUpdates";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import type { VariableState } from "../Collection";
import JSObjectCollection from "../Collection";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";

jest.mock("../../evalTreeWithChanges.ts", () => {
  return {
    evalTreeWithChanges: () => ({}),
  };
});

jest.mock("../../handlers/evalTree", () => {
  const evalTree = {
    JSObject1: {
      var: {},
      var2: new Set([1, 2]),
      variables: ["var", "var2"],
      ENTITY_TYPE: "JSACTION",
    },
  };

  return {
    dataTreeEvaluator: {
      setupUpdateTreeWithDifferences: () => ({
        evalOrder: [],
        unEvalUpdates: [],
      }),
      evalAndValidateSubTree: () => ({ evalMetaUpdates: [] }),
      evalTree,
      getEvalTree() {
        return this.evalTree;
      },
    },
  };
});

describe("Mutation", () => {
  it("Global scope value mutation tracking", async () => {
    const dataTree = {
      JSObject1: {
        var: {},
        var2: new Set([1, 2]),
        variables: ["var", "var2"],
        ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      },
    } as unknown as DataTree;

    JSObjectCollection.setVariableState(dataTree as unknown as VariableState);

    const evalContext = createEvaluationContext({
      dataTree,
      isTriggerBased: true,
      skipEntityFunctions: true,
    });

    ExecutionMetaData.setExecutionMetaData({
      jsVarUpdateTrackingDisabled: false,
    });

    Object.assign(self, evalContext);

    eval(`
    JSObject1.var = {};
    JSObject1.var.b = {};
    JSObject1.var.b.a = [];
    JSObject1.var.b.a.push(2);
    JSObject1.var2.add(3);
    `);

    ExecutionMetaData.setExecutionMetaData({
      jsVarUpdateTrackingDisabled: true,
    });

    expect(JSVariableUpdates.getAll()).toEqual([
      { path: "JSObject1.var", method: "SET", value: { b: { a: [2] } } },
      { path: "JSObject1.var.b", method: "SET", value: { a: [2] } },
      { path: "JSObject1.var.b.a", method: "SET", value: [2] },
      {
        path: "JSObject1.var.b.a",
        method: "PROTOTYPE_METHOD_CALL",
        value: [].push,
      },
      {
        path: "JSObject1.var2",
        method: "PROTOTYPE_METHOD_CALL",
        value: new Set().add,
      },
    ]);

    const modifiedVariablesList = getUpdatedPaths(JSVariableUpdates.getAll());

    expect(modifiedVariablesList).toEqual([
      ["JSObject1", "var"],
      ["JSObject1", "var", "b"],
      ["JSObject1", "var", "b", "a"],
      ["JSObject1", "var", "b", "a"],
      ["JSObject1", "var2"],
    ]);
  });
});
