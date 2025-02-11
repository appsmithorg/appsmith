import type { JSActionEntity, WidgetEntity } from "ee/entities/DataTree/types";
import { getOnlyAffectedJSObjects, getIsNewWidgetAdded } from "./utils";
import type { UnEvalTree } from "entities/DataTree/dataTreeTypes";
import {
  DataTreeDiffEvent,
  getAllPathsBasedOnDiffPaths,
  type DataTreeDiff,
} from "ee/workers/Evaluation/evaluationUtils";
import { create } from "mutative";

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

describe("getAllPathsBasedOnDiffPaths", () => {
  const initialTree = {
    WidgetName: {
      1: "yo",
      name: "WidgetName",
      objectProperty: {
        childObjectProperty: [
          "1",
          1,
          {
            key: "value",
            2: 1,
          },
          ["1", "2"],
        ],
      },
      stringProperty: new String("Hello"),
    } as Record<string, unknown>,
  };
  const initialAllKeys = {
    WidgetName: true,
    "WidgetName.1": true,
    "WidgetName.name": true,
    "WidgetName.objectProperty": true,
    "WidgetName.objectProperty.childObjectProperty": true,
    "WidgetName.objectProperty.childObjectProperty[0]": true,
    "WidgetName.objectProperty.childObjectProperty[1]": true,
    "WidgetName.objectProperty.childObjectProperty[2]": true,
    "WidgetName.objectProperty.childObjectProperty[2].key": true,
    "WidgetName.objectProperty.childObjectProperty[2].2": true,
    "WidgetName.objectProperty.childObjectProperty[3]": true,
    "WidgetName.objectProperty.childObjectProperty[3][0]": true,
    "WidgetName.objectProperty.childObjectProperty[3][1]": true,
    "WidgetName.stringProperty": true,
  } as Record<string, true>;

  test("should generate all paths of the widget when a new widget as added", () => {
    const updatedAllKeys = getAllPathsBasedOnDiffPaths(
      initialTree,
      [
        {
          event: DataTreeDiffEvent.NEW,
          payload: { propertyPath: "WidgetName" },
        },
      ],
      // allKeys is empty initally
      {},
    );

    expect(initialAllKeys).toEqual(updatedAllKeys);
  });
  test("should not update allKeys when there are no diffs", () => {
    const updatedAllKeys = getAllPathsBasedOnDiffPaths(initialTree, [], {
      ...initialAllKeys,
    });

    // allkeys are not altered here since the diff is empty
    expect(initialAllKeys).toEqual(updatedAllKeys);
  });
  test("should delete the correct paths within allKeys when a node within a widget is deleted", () => {
    const deletedWidgetName = create(initialTree, (draft) => {
      // a property within the widget is deleted
      delete draft.WidgetName.name;
    });
    const updatedAllKeys = getAllPathsBasedOnDiffPaths(
      deletedWidgetName,
      [
        {
          event: DataTreeDiffEvent.DELETE,
          payload: {
            propertyPath: "WidgetName.name",
          },
        },
      ],
      // we have to make a copy since allKeys is mutable
      { ...initialAllKeys },
    );
    const deletedWidgetNameInAllKeys = create(initialAllKeys, (draft) => {
      delete draft["WidgetName.name"];
    });

    expect(deletedWidgetNameInAllKeys).toEqual(updatedAllKeys);
  });

  test("should add the correct paths to the allKeys when a node within a widget is added", () => {
    const addedNewWidgetProperty = create(initialTree, (draft) => {
      // new property is added to the widget
      draft.WidgetName.widgetNewProperty = "newValue";
    });

    const updatedAllKeys = getAllPathsBasedOnDiffPaths(
      addedNewWidgetProperty,
      [
        {
          event: DataTreeDiffEvent.NEW,
          payload: {
            propertyPath: "WidgetName.widgetNewProperty",
          },
        },
      ],
      // we have to make a copy since allKeys is mutable
      { ...initialAllKeys },
    );
    const addedNewWidgetPropertyInAllKeys = create(initialAllKeys, (draft) => {
      draft["WidgetName.widgetNewProperty"] = true;
    });

    expect(addedNewWidgetPropertyInAllKeys).toEqual(updatedAllKeys);
  });

  test("should generate the correct paths when the value changes form a simple primitive to a collection, this is for EDIT diffs", () => {
    const addedNewWidgetProperty = create(initialTree, (draft) => {
      //existing property within the widget is edited
      draft.WidgetName.name = [{ a: 1 }];
    });

    const updatedAllKeys = getAllPathsBasedOnDiffPaths(
      addedNewWidgetProperty,
      [
        {
          event: DataTreeDiffEvent.EDIT,
          payload: {
            propertyPath: "WidgetName.name",
          },
        },
      ],
      // we have to make a copy since allKeys is mutable
      { ...initialAllKeys },
    );
    const addedACollectionInAllKeys = create(initialAllKeys, (draft) => {
      draft["WidgetName.name[0]"] = true;
      draft["WidgetName.name[0].a"] = true;
    });

    expect(addedACollectionInAllKeys).toEqual(updatedAllKeys);
  });
});
