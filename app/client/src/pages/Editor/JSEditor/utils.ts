import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import { JSAction } from "entities/JSCollection";
import {
  ECMA_VERSION,
  NodeTypes,
  SourceType,
  RUN_GUTTER_CLASSNAME,
  RUN_GUTTER_ID,
} from "./constants";
import { DropdownOption } from "components/ads/Dropdown";

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

// Function to get start line of js function from code, returns null if function not found
export const getJSFunctionStartLineFromCode = (
  code: string,
  funcName: string,
): number | null => {
  let ast: Node = { end: 0, start: 0, type: "" };
  let line: number | null = null;
  try {
    ast = getAST(code, SourceType.module);
  } catch (e) {
    return line;
  }

  ancestor(ast, {
    Property(node, ancestors: Node[]) {
      // We are only interested in identifiers at this depth (exported object keys)
      const depth = ancestors.length - 3;

      if (
        isPropertyNode(node) &&
        node.key.name === funcName &&
        ancestors[depth] &&
        ancestors[depth].type === NodeTypes.ExportDefaultDeclaration &&
        node.loc // node has location data
      ) {
        // 1 is subtracted because codeMirror's line is zero-indexed, this isn't
        line = node.loc.start.line - 1;
      }
    },
  });

  return line;
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

export const getJSFunctionsLineGutters = (
  jsActions: JSAction[],
  runFuction: (jsAction: JSAction) => void,
): CodeEditorGutter[] => {
  return jsActions.map((jsAction) => {
    return {
      element: createGutterMarker(() => runFuction(jsAction)),
      gutterId: RUN_GUTTER_ID,
      line: (code: string) =>
        getJSFunctionStartLineFromCode(code, jsAction.name),
    };
  });
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
