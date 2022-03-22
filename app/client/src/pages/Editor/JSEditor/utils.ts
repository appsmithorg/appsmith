import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import { JSAction, JSCollection } from "entities/JSCollection";
import {
  ECMA_VERSION,
  NodeTypes,
  SourceType,
  RUN_GUTTER_CLASSNAME,
  RUN_GUTTER_ID,
  NO_FUNCTION_DROPDOWN_OPTION,
} from "./constants";
import { DropdownOption } from "components/ads/Dropdown";
import { find } from "lodash";

interface IdentifierNode extends Node {
  type: NodeTypes.Identifier;
  name: string;
}
interface PropertyNode extends Node {
  type: NodeTypes.Property;
  key: IdentifierNode;
}

export interface JSActionDropdownOption extends DropdownOption {
  data: JSAction | null;
}

const isPropertyNode = (node: Node): node is PropertyNode => {
  return node.type === NodeTypes.Property;
};

const getAST = (code: string, sourceType: SourceType) =>
  parse(code, {
    ecmaVersion: ECMA_VERSION,
    sourceType: sourceType,
    locations: true, // Adds location data to each node
  });

const isCursorWithinNode = (
  location: acorn.SourceLocation,
  cursorLineNumber: number,
) => {
  return (
    location.start.line <= cursorLineNumber &&
    location.end.line >= cursorLineNumber
  );
};

// Function to get start line of js function from code, returns null if function not found
export const getJSFunctionStartLineFromCode = (
  code: string,
  cursorLine: number,
  jsActions: JSAction[],
): { line: number; action: JSAction } | null => {
  let ast: Node = { end: 0, start: 0, type: "" };
  let result: { line: number; action: JSAction } | null = null;
  try {
    ast = getAST(code, SourceType.module);
  } catch (e) {
    return result;
  }

  ancestor(ast, {
    Property(node, ancestors: Node[]) {
      // We are only interested in identifiers at this depth (exported object keys)
      const depth = ancestors.length - 3;
      const action =
        isPropertyNode(node) && find(jsActions, ["name", node.key.name]);
      if (
        action &&
        node.loc &&
        isCursorWithinNode(node.loc, cursorLine + 1) &&
        ancestors[depth] &&
        ancestors[depth].type === NodeTypes.ExportDefaultDeclaration
      ) {
        // 1 is subtracted because codeMirror's line is zero-indexed, this isn't
        result = {
          line: node.loc.start.line - 1,
          action,
        };
      }
    },
  });
  return result;
};

export const createGutterMarker = (gutterOnclick: () => void) => {
  const marker = document.createElement("button");
  marker.innerHTML = "&#9654;";
  marker.classList.add(RUN_GUTTER_CLASSNAME);
  marker.onclick = function(e) {
    e.preventDefault();
    gutterOnclick();
  };
  return marker;
};

export const getJSFunctionLineGutter = (
  jsActions: JSAction[],
  runFuction: (jsAction: JSAction) => void,
  showGutters: boolean,
): CodeEditorGutter => {
  const gutter: CodeEditorGutter = {
    getGutterConfig: null,
    gutterId: RUN_GUTTER_ID,
  };
  if (!showGutters || !jsActions.length) return gutter;

  return {
    getGutterConfig: (code: string, cursorLineNumber: number) => {
      const config = getJSFunctionStartLineFromCode(
        code,
        cursorLineNumber,
        jsActions,
      );
      return config
        ? {
            line: config.line,
            element: createGutterMarker(() => runFuction(config.action)),
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

export const getJSActionOption = (
  activeJSAction: JSAction | null,
  jsActions: JSAction[],
): JSActionDropdownOption => {
  let initialJSActionOption = NO_FUNCTION_DROPDOWN_OPTION;
  if (activeJSAction) {
    initialJSActionOption = convertJSActionToDropdownOption(activeJSAction);
  } else if (jsActions.length) {
    initialJSActionOption = convertJSActionToDropdownOption(jsActions[0]);
  }
  return initialJSActionOption;
};
