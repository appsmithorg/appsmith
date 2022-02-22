import { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import { JSAction } from "entities/JSCollection";
import { getJSFunctionLineFromJSObject } from "workers/ast";
import { RUN_GUTTER_ID } from "./JSFunctionRun/constants";

export const makeMarker = (
  runFunction: (jsAction: JSAction) => void,
  jsAction: JSAction,
) => {
  const marker = document.createElement("button");
  // marker.style.color = "#822";
  marker.innerHTML = "&#9654;";
  marker.classList.add("run-marker-gutter");
  marker.onclick = function(e) {
    e.preventDefault();
    runFunction(jsAction);
  };
  return marker;
};

export const getGuttersFromJsFunctions = (
  JSFunctions: JSAction[],
  runFuction: (jsAction: JSAction) => void,
): CodeEditorGutter => {
  return JSFunctions.map((jsAction) => {
    return {
      element: makeMarker(runFuction, jsAction),
      gutterId: RUN_GUTTER_ID,
      line: (code: string) =>
        getJSFunctionLineFromJSObject(code, jsAction.name),
    };
  });
};
