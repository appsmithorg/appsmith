import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getJSEntities } from "../JSObject";
import type { JsPatches } from "../types";

export const mergeJSObjectsToUnevalTree = (
  oldUnevalTree: DataTree | undefined = {},
  newUnevalTree: DataTree,
  jsPatches: any,
) => {
  const { patches, shouldReplaceAllNodes } = jsPatches;
  const newUnevalTreeWithPatches = patches.reduce(
    (acc: DataTree, patch: any) => {
      acc[patch.path] = patch.value;
      return acc;
    },
    { ...newUnevalTree },
  );
  //in the case of shouldReplaceAllNodes, the patches represent all JSObjects that the current unevalTree consists of
  if (shouldReplaceAllNodes) {
    return newUnevalTreeWithPatches;
  }
  // In the case of patches, we need to merge the patches with the previous uneval tree
  const prevJSObjects = getJSEntities(oldUnevalTree);
  return { ...prevJSObjects, ...newUnevalTreeWithPatches };
};

export const getAffectedJSObjectIdsFromJsPatches = (
  prevUnEvalValue: DataTree,
  currUevalTree: DataTree,
  jsPatches: JsPatches,
) => {
  const { patches, shouldReplaceAllNodes } = jsPatches;
  if (shouldReplaceAllNodes) {
    // This is a list of all JS object ids in the current uneval tree as well as the previous uneval tree
    // When we diff the JS objects we use this list and during the shouldReplaceAllNodes all JSObjects are included and no node is missed out.
    const allJSObjectIds = Object.values({
      ...getJSEntities(currUevalTree || {}),
      ...getJSEntities(prevUnEvalValue || {}),
    }).map((jsObject) => jsObject.actionId);

    return Array.from(new Set(allJSObjectIds));
  }
  return patches.map((patch: any) => patch.value.actionId);
};
