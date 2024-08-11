/* eslint-disable @typescript-eslint/no-explicit-any */
import generate from "nanoid/generate";
import type { DSLWidget, WidgetProps } from "./types";
import { isString } from "lodash";
import { getDynamicStringSegments, isDynamicValue } from "../dynamicBinding";

export const DATA_BIND_REGEX_GLOBAL = /{{([\s\S]*?)}}/g;

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

// ### JS Action ###

export type DataTreeEntity = any;
export type JSActionEntity = any;

function isJSAction(entity: DataTreeEntity): entity is JSActionEntity {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === "JSACTION"
  );
}

//{{}}{{}}}
export const getDynamicBindings = (
  dynamicString: string,
  entity?: DataTreeEntity,
): { stringSegments: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !isString(dynamicString)) {
    return { stringSegments: [], jsSnippets: [] };
  }
  const sanitisedString = dynamicString.trim();
  let stringSegments, paths: any;
  if (entity && isJSAction(entity)) {
    stringSegments = [sanitisedString];
    paths = [sanitisedString];
  } else {
    // Get the {{binding}} bound values
    stringSegments = getDynamicStringSegments(sanitisedString);
    // Get the "binding" path values
    paths = stringSegments.map((segment) => {
      const length = segment.length;
      const matches = isDynamicValue(segment);
      if (matches) {
        return segment.substring(2, length - 2);
      }
      return "";
    });
  }
  return { stringSegments: stringSegments, jsSnippets: paths };
};

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  const js = stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `\`${segment}\``;
      }
    })
    .join(" + ");
  return js;
};

// ### END JS Action ###

// ### Migration helpers ###
/*
 * Function to traverse the DSL tree and execute the given migration function for each widget present in
 * the tree.
 */
export const traverseDSLAndMigrate = (
  DSL: DSLWidget,
  migrateFn: (widget: WidgetProps) => void,
) => {
  DSL.children = DSL.children?.map((widget: DSLWidget) => {
    migrateFn(widget);

    if (widget.children && widget.children.length > 0) {
      widget = traverseDSLAndMigrate(widget, migrateFn);
    }

    return widget;
  });

  return DSL;
};
// ### END Migration helpers ###
