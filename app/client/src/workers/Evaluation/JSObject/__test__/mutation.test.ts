import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import JSObjectCollection from "../Collection";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import TriggerEmitter, {
  jsVariableUpdatesHandlerWrapper,
} from "workers/Evaluation/fns/utils/TriggerEmitter";

jest.mock("../../evalTreeWithChanges.ts", () => {
  return {
    evalTreeWithChanges: () => ({}),
  };
});

const applyJSVariableUpdatesToEvalTreeMock = jest.fn();

jest.mock("../JSVariableUpdates.ts", () => ({
  ...jest.requireActual("../JSVariableUpdates.ts"),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyJSVariableUpdatesToEvalTree: (...args: any[]) => {
    applyJSVariableUpdatesToEvalTreeMock(args);
  },
}));

jest.mock("../../../../utils/MessageUtil.ts", () => ({
  ...jest.requireActual("../../../../utils/MessageUtil.ts"),
  sendMessage: jest.fn(),
}));

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

TriggerEmitter.on(
  "process_js_variable_updates",
  jsVariableUpdatesHandlerWrapper,
);

describe("Mutation", () => {
  it("Global scope value mutation tracking", async () => {
    const dataTree = {
      JSObject1: {
        var: {},
        var2: new Set([1, 2]),
        variables: ["var", "var2"],
        ENTITY_TYPE: ENTITY_TYPE.JSACTION,
      },
    };

    JSObjectCollection.setVariableValue(
      dataTree.JSObject1.var,
      "JSObject1.var",
    );
    JSObjectCollection.setVariableValue(
      dataTree.JSObject1.var2,
      "JSObject1.var2",
    );

    const evalContext = createEvaluationContext({
      dataTree: dataTree as unknown as DataTree,
      isTriggerBased: true,
      removeEntityFunctions: true,
    });

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
    });

    Object.assign(self, evalContext);

    eval(`
    JSObject1.var = {};
    JSObject1.var.b = {};
    JSObject1.var.b.a = [];
    JSObject1.var.b.a.push(2);
    JSObject1.var2.add(3);
    `);

    await new Promise((resolve) => setTimeout(resolve, 100));

    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: false,
    });

    expect(applyJSVariableUpdatesToEvalTreeMock).toBeCalledWith([
      {
        "JSObject1.var": { method: "GET", path: "JSObject1.var" },
        "JSObject1.var2": { method: "GET", path: "JSObject1.var2" },
      },
    ]);
  });
});
