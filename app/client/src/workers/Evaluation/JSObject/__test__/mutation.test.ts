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
      oldConfigTree: {
        JSObject1: {
          variables: ["var", "var2"],
          ENTITY_TYPE: "JSACTION",
        },
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
      enableJSVarUpdateTracking: true,
      enableJSVarUpdate: true,
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
      enableJSVarUpdateTracking: false,
    });

    expect(JSVariableUpdates.getMap()).toEqual({
      "JSObject1.var": { path: "JSObject1.var", method: "GET" },
      "JSObject1.var2": {
        path: "JSObject1.var2",
        method: "GET",
      },
    });

    const modifiedVariablesList = getUpdatedPaths(JSVariableUpdates.getMap());

    expect(modifiedVariablesList).toEqual([
      ["JSObject1", "var"],
      ["JSObject1", "var2"],
    ]);
  });
});
