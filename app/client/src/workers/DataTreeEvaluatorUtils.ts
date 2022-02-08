import produce from "immer";
import set from "lodash/set";
import { DataTree } from "../entities/DataTree/dataTreeFactory";

export const setter = (
  baseState: Record<string, unknown> | DataTree,
  path: string | Array<string>,
  value: unknown,
) => {
  const newState = produce(baseState, (draft) => {
    set(draft, path, value);
  });
  baseState = newState; // overwrite the baseState
  return newState;
};
