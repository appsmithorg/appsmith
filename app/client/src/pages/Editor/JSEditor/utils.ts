import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import { JSAction, JSCollection } from "entities/JSCollection";
import {
  RUN_GUTTER_CLASSNAME,
  RUN_GUTTER_ID,
  NO_FUNCTION_DROPDOWN_OPTION,
} from "./constants";
import { DropdownOption } from "components/ads/Dropdown";
import { find, memoize } from "lodash";
import { ECMA_VERSION, NodeTypes, SourceType } from "constants/ast";
import { isLiteralNode, isPropertyNode, PropertyNode } from "workers/ast";

export interface JSActionDropdownOption extends DropdownOption {
  data: JSAction | null;
}

export const getAST = memoize((code: string, sourceType: SourceType) =>
  parse(code, {
    ecmaVersion: ECMA_VERSION,
    sourceType: sourceType,
    locations: true, // Adds location data to each node
  }),
);

export const isCursorWithinNode = (
  nodeLocation: acorn.SourceLocation,
  cursorLineNumber: number,
) => {
  return (
    nodeLocation.start.line <= cursorLineNumber &&
    nodeLocation.end.line >= cursorLineNumber
  );
};

const getNameFromPropertyNode = (node: PropertyNode): string =>
  isLiteralNode(node.key) ? String(node.key.value) : node.key.name;

// Function to get start line of js function from code, returns null if function not found
export const getJSFunctionStartLineFromCode = (
  code: string,
  cursorLine: number,
): { line: number; actionName: string } | null => {
  let ast: Node = { end: 0, start: 0, type: "" };
  let result: { line: number; actionName: string } | null = null;
  try {
    ast = getAST(code, SourceType.module);
  } catch (e) {
    return result;
  }

  ancestor(ast, {
    Property(node, ancestors: Node[]) {
      // We are only interested in identifiers at this depth (exported object keys)
      const depth = ancestors.length - 3;
      if (
        isPropertyNode(node) &&
        (node.value.type === NodeTypes.ArrowFunctionExpression ||
          node.value.type === NodeTypes.FunctionExpression) &&
        node.loc &&
        isCursorWithinNode(node.loc, cursorLine + 1) &&
        ancestors[depth] &&
        ancestors[depth].type === NodeTypes.ExportDefaultDeclaration
      ) {
        // 1 is subtracted because codeMirror's line is zero-indexed, this isn't
        result = {
          line: node.loc.start.line - 1,
          actionName: getNameFromPropertyNode(node),
        };
      }
    },
  });
  return result;
};

export const createGutterMarker = (gutterOnclick: () => void) => {
  const marker = document.createElement("button");
  // For most browsers the default type of button is submit, this causes the page to reload when marker is clicked
  // Set type to button, to prevent this behaviour
  marker.type = "button";
  marker.innerHTML = "&#9654;";
  marker.classList.add(RUN_GUTTER_CLASSNAME);
  marker.onmousedown = function(e) {
    e.preventDefault();
    gutterOnclick();
  };
  // Allows executing functions (via run gutter) when devtool is open
  marker.ontouchstart = function(e) {
    e.preventDefault();
    gutterOnclick();
  };
  return marker;
};

export const getJSFunctionLineGutter = (
  jsActions: JSAction[],
  runFuction: (jsAction: JSAction) => void,
  showGutters: boolean,
  onFocusAction: (jsAction: JSAction) => void,
): CodeEditorGutter => {
  const gutter: CodeEditorGutter = {
    getGutterConfig: null,
    gutterId: RUN_GUTTER_ID,
  };
  if (!showGutters || !jsActions.length) return gutter;

  return {
    getGutterConfig: (code: string, lineNumber: number) => {
      const config = getJSFunctionStartLineFromCode(code, lineNumber);
      const action = find(jsActions, ["name", config?.actionName]);
      return config && action
        ? {
            line: config.line,
            element: createGutterMarker(() => runFuction(action)),
            isFocusedAction: () => {
              onFocusAction(action);
            },
          }
        : null;
    },
    gutterId: RUN_GUTTER_ID,
  };
};

export const convertJSActionsToDropdownOptions = (
  JSActions: JSAction[],
): JSActionDropdownOption[] => {
  return JSActions.map(convertJSActionToDropdownOption);
};

export const convertJSActionToDropdownOption = (
  JSAction: JSAction,
): JSActionDropdownOption => ({
  label: JSAction.name,
  value: JSAction.id,
  data: JSAction,
  hasCustomBadge: !!JSAction.actionConfiguration.isAsync,
});

export const getActionFromJsCollection = (
  actionId: string | null,
  jsCollection: JSCollection,
): JSAction | null => {
  if (!actionId) return null;
  return jsCollection.actions.find((action) => action.id === actionId) || null;
};

/**
 * Returns dropdown option based on priority and availability
 */
export const getJSActionOption = (
  activeJSAction: JSAction | null,
  jsActions: JSAction[],
): JSActionDropdownOption => {
  let jsActionOption = NO_FUNCTION_DROPDOWN_OPTION;
  if (activeJSAction) {
    jsActionOption = convertJSActionToDropdownOption(activeJSAction);
  } else if (jsActions.length) {
    jsActionOption = convertJSActionToDropdownOption(jsActions[0]);
  }
  return jsActionOption;
};
