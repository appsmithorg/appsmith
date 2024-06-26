import type {
  JSActionEntity,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import type { UnEvalTree } from "entities/DataTree/dataTreeTypes";

import {
  getAffectedJSObjectIdsFromJsPatches,
  mergeJSObjectsToUnevalTree,
} from "./evalTreeUtils";
const jsPatches = {
  shouldReplaceAllNodes: false,
  patches: [
    {
      path: "jsObject1",
      value: {
        ENTITY_TYPE: "JSACTION",
        actionId: "1",
      } as JSActionEntity,
    },
    {
      path: "jsObject2",
      value: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
      } as JSActionEntity,
    },
  ],
};

describe("mergeJSObjectsToUnevalTree", () => {
  const unEvalTree = {
    widget1: {
      ENTITY_TYPE: "WIDGET",
    } as WidgetEntity,
  } as UnEvalTree;
  test("should decompress jsPatches to the newUnevalTree", () => {
    const result = mergeJSObjectsToUnevalTree({}, unEvalTree, jsPatches);
    expect(result).toEqual({
      widget1: {
        ENTITY_TYPE: "WIDGET",
      },
      jsObject1: {
        ENTITY_TYPE: "JSACTION",
        actionId: "1",
      },
      jsObject2: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
      },
    });
  });

  test("should decompress jsPatches to the newUnevalTree and merge it on top of previous uneval's tree JSObjects", () => {
    const jsPatches = {
      shouldReplaceAllNodes: false,
      patches: [
        {
          path: "jsObject1",
          value: {
            ENTITY_TYPE: "JSACTION",
            actionId: "1",
          },
        },
        {
          path: "jsObject2",
          value: {
            ENTITY_TYPE: "JSACTION",
            actionId: "2",
            text: "b",
          },
        },
      ],
    };
    const prevUnevalTree = {
      ...unEvalTree,
      jsObject2: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
        text: "a",
      },
      jsObject3: {
        ENTITY_TYPE: "JSACTION",
        actionId: "3",
      },
    } as UnEvalTree;
    const result = mergeJSObjectsToUnevalTree(
      prevUnevalTree,
      unEvalTree,
      jsPatches,
    );
    expect(result).toEqual({
      widget1: {
        ENTITY_TYPE: "WIDGET",
      },
      jsObject1: {
        ENTITY_TYPE: "JSACTION",
        actionId: "1",
      },
      jsObject3: {
        ENTITY_TYPE: "JSACTION",
        actionId: "3",
      },
      //  the patches should overwrite the previous uneval's tree JS Object
      jsObject2: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
        text: "b",
      },
    });
  });

  test("should not merge the jsObjects of the previous unevals tree's jsobjects to the newUnevalTree when 'shouldReplaceAllNodes' is passed", () => {
    const jsPatches = {
      shouldReplaceAllNodes: true,
      patches: [
        {
          path: "jsObject1",
          value: {
            ENTITY_TYPE: "JSACTION",
            actionId: "1",
          },
        },
        {
          path: "jsObject2",
          value: {
            ENTITY_TYPE: "JSACTION",
            actionId: "2",
          },
        },
      ],
    };
    const prevUnevalTree = {
      ...unEvalTree,
      // should be ignored when being merged to the unevalTree
      jsObject2: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
        text: "a",
      },
      jsObject3: {
        ENTITY_TYPE: "JSACTION",
        actionId: "3",
      },
    } as UnEvalTree;
    const result = mergeJSObjectsToUnevalTree(
      prevUnevalTree,
      unEvalTree,
      jsPatches,
    );
    expect(result).toEqual({
      widget1: {
        ENTITY_TYPE: "WIDGET",
      },
      // all js objects should come from the patches none from the previous uneval's tree
      jsObject1: {
        ENTITY_TYPE: "JSACTION",
        actionId: "1",
      },
      jsObject2: {
        ENTITY_TYPE: "JSACTION",
        actionId: "2",
      },
    });
  });
});

describe("getAffectedJSObjectIdsFromJsPatches", () => {
  const unEvalTree = {
    widget1: {
      ENTITY_TYPE: "WIDGET",
    } as WidgetEntity,
    jsObject4: {
      ENTITY_TYPE: "JSACTION",
      actionId: "4",
      text: "a",
    } as JSActionEntity,
  } as UnEvalTree;
  const prevUnevalTree = {
    ...unEvalTree,
    jsObject2: {
      ENTITY_TYPE: "JSACTION",
      actionId: "2",
      text: "a",
    },
    jsObject3: {
      ENTITY_TYPE: "JSACTION",
      actionId: "3",
    },
  } as UnEvalTree;
  test("should rely only on the patch's actionIds when 'shouldReplaceAllNodes' is false", () => {
    expect(
      getAffectedJSObjectIdsFromJsPatches(
        prevUnevalTree,
        unEvalTree,
        jsPatches,
      ),
    ).toEqual(["1", "2"]);
  });
  test("should get all previous and current tree's JSAction ids when 'shouldReplaceAllNodes' is true", () => {
    expect(
      getAffectedJSObjectIdsFromJsPatches(prevUnevalTree, unEvalTree, {
        ...jsPatches,
        shouldReplaceAllNodes: true,
      }),
    ).toEqual(["4", "2", "3"]);
  });
});
