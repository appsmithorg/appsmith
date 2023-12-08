import type { Action } from "entities/Action";
import type { JSAction, JSCollection } from "entities/JSCollection";

export function getPluginActionNameToDisplay(action: Action) {
  return action.name;
}

export function getJSActionPathNameToDisplay(
  action: JSAction,
  collection: JSCollection,
) {
  return collection.name + "." + action.name;
}

export function getJSActionNameToDisplay(action: JSAction) {
  return action.name;
}
