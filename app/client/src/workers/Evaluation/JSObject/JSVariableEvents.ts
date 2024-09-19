import { get, isEmpty } from "lodash";
import { diff as deepDiff } from "deep-diff";
import type { JSUpdate } from "utils/JSPaneUtils";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { getType } from "utils/TypeHelpers";

type JSUpdates = Record<string, JSUpdate>;

let prevJSUpdates: JSUpdates;

function getVariableObject(jsUpdates: JSUpdates) {
  const prevJSObjects = Object.entries(jsUpdates);
  const prevJSObjectVar: Record<string, unknown> = {};

  for (const [jsObjectName, jsObjectBody] of prevJSObjects) {
    const variables = jsObjectBody.parsedBody?.variables;

    if (!variables?.length) continue;

    const varKeyMap: Record<string, string> = {};

    variables.forEach(({ name }) => {
      varKeyMap[name] = name;
    });
    prevJSObjectVar[jsObjectName] = varKeyMap;
  }

  return prevJSObjectVar;
}

function getVariableDiff(jsUpdates: JSUpdates) {
  if (isEmpty(jsUpdates)) return;

  if (!prevJSUpdates) {
    prevJSUpdates = jsUpdates;

    return;
  }

  const prevJSObjectVar = getVariableObject(prevJSUpdates);
  const jsObjectVar = getVariableObject(jsUpdates);
  const diff = deepDiff(prevJSObjectVar, jsObjectVar);

  prevJSUpdates = jsUpdates;

  return diff;
}

export function getJSVariableCreatedEvents(jsUpdates: JSUpdates) {
  const jsVarDiff = getVariableDiff(jsUpdates);

  const jsVarsCreated: { path: string; type: string }[] = [];

  jsVarDiff?.forEach((diff) => {
    if (diff.kind === "N" && diff.path?.length === 2) {
      const evalTree = dataTreeEvaluator?.getEvalTree() || {};
      const value = get(evalTree, diff.path);
      const type = getType(value);

      jsVarsCreated.push({ path: diff.path?.join("."), type });
    }
  });

  return jsVarsCreated;
}
