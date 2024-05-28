import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { getOnlyAffectedJSObjects } from "./utils";

describe("getOnlyAffectedJSObjects", () => {
  const dataTree = {
    JSObject1: {
      actionId: "1234",
      variables: ["var", "var2"],
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
    },
    JSObject2: {
      actionId: "5678",
      variables: ["var", "var2"],
      ENTITY_TYPE: ENTITY_TYPE.JSACTION,
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
        ENTITY_TYPE: ENTITY_TYPE.JSACTION,
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
