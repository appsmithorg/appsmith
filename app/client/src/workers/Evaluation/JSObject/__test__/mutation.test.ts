import {
  jsVariableUpdates,
  filterPatches,
  diffModifiedVariables,
} from "../JSVariableUpdates";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import {
  createEvaluationContext,
  evaluateAsync,
} from "workers/Evaluation/evaluate";
import { VariableState, jsObjectCollection } from "../Collection";

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
  });

  it("Global scope value mutation tracking", async () => {
    jsVariableUpdates.enable();
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

    Object.assign(self, evalContext);

    eval(`
    JSObject1.var = {};
    JSObject1.var.b = {};
    JSObject1.var.b.a = [];
    JSObject1.var.b.a.push(2);
    JSObject1.var2.add(3);
    `);

    jsObjectCollection.setVariableState((self as unknown) as VariableState);

    const modifiedVariablesList = filterPatches(jsVariableUpdates.getAll());
    const diffs = diffModifiedVariables(modifiedVariablesList);

    jsVariableUpdates.disable();

    expect(modifiedVariablesList).toEqual(["JSObject1.var", "JSObject1.var2"]);
    expect(diffs).toEqual([
      [{ kind: "N", path: ["JSObject1", "var", "b"], rhs: { a: [2] } }],
      undefined,
    ]);
  });
});
