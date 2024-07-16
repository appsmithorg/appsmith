import type {
  JSActionEntity,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import { getOnlyAffectedJSObjects, getIsNewWidgetAdded } from "./utils";
import type { UnEvalTree } from "entities/DataTree/dataTreeTypes";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";

describe("getOnlyAffectedJSObjects", () => {
  const dataTree = {
    JSObject1: {
      actionId: "1234",
      variables: ["var", "var2"],
      ENTITY_TYPE: "JSACTION",
    },
    JSObject2: {
      actionId: "5678",
      variables: ["var", "var2"],
      ENTITY_TYPE: "JSACTION",
    },
  } as Record<string, JSActionEntity>;
  test("should return only the affected JS Objects when the ids collection is provided ", () => {
    const result = getOnlyAffectedJSObjects(dataTree, {
      ids: ["1234"],
      isAllAffected: false,
    });
    expect(result).toEqual({
      JSObject1: {
        actionId: "1234",
        variables: ["var", "var2"],
        ENTITY_TYPE: "JSACTION",
      },
    });
  });
  test("should return the entire tree when isAllAffected is set to true ", () => {
    const result = getOnlyAffectedJSObjects(dataTree, {
      isAllAffected: true,
      ids: [],
    });
    expect(result).toEqual(dataTree);
  });

  test("should return nothing when there is no matching action Id", () => {
    const result = getOnlyAffectedJSObjects(dataTree, {
      ids: ["someInvalidId"],
      isAllAffected: false,
    });
    expect(result).toEqual({});
  });
});

describe("getIsNewWidgetAdded", () => {
  const unEvalTree: UnEvalTree = {
    newWidget: {
      property: "value",
      ENTITY_TYPE: "WIDGET",
      dynamicBindingPathList: [],
      bindingPaths: {},
      reactivePaths: {},
      widgetName: "newWidget",
      widgetId: "newWidget",
      meta: {},
      renderMode: "CANVAS",
      existingWidget: "dd",
    } as unknown as WidgetEntity,
  };

  it("should return true if a new widget is added", () => {
    const translatedDiffs = [
      {
        payload: { propertyPath: "newWidget" },
        event: "NEW",
      },
    ] as DataTreeDiff[];

    const result = getIsNewWidgetAdded(translatedDiffs, unEvalTree);
    expect(result).toBeTruthy();
  });

  it("should return false if no new widget is added", () => {
    const translatedDiffs: DataTreeDiff[] = [
      {
        payload: { propertyPath: "newWidget" },
        event: "EDIT",
      },
      {
        payload: { propertyPath: "newWidget" },
        event: "DELETE",
      },
    ] as DataTreeDiff[];

    const result = getIsNewWidgetAdded(translatedDiffs, unEvalTree);
    expect(result).toBeFalsy();
  });

  it("should handle empty diffs and return false", () => {
    const translatedDiffs: DataTreeDiff[] = [];
    const unEvalTree: UnEvalTree = {};
    const result = getIsNewWidgetAdded(translatedDiffs, unEvalTree);
    expect(result).toBeFalsy();
  });
});
