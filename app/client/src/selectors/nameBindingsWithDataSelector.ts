import { DataTree } from "reducers";
import { JSONPath } from "jsonpath-plus";
import { createSelector } from "reselect";
import { getDataTree } from "./entitiesSelector";

export type NameBindingsWithData = Record<string, object>;
export const getNameBindingsWithData = createSelector(
  getDataTree,
  (dataTree: DataTree): NameBindingsWithData => {
    const nameBindingsWithData: Record<string, object> = {};
    Object.keys(dataTree.nameBindings).forEach(key => {
      const nameBindings = dataTree.nameBindings[key];
      const evaluatedValue = JSONPath({
        path: nameBindings,
        json: dataTree,
      })[0];
      if (evaluatedValue && key !== "undefined") {
        nameBindingsWithData[key] = evaluatedValue;
      }
    });

    return nameBindingsWithData;
  },
);
