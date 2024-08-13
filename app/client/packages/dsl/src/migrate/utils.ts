/* eslint-disable @typescript-eslint/no-explicit-any */
import generate from "nanoid/generate";
import type { DSLWidget, WidgetProps } from "./types";
import { getDynamicBindings } from "@appsmith/evaluation";

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
