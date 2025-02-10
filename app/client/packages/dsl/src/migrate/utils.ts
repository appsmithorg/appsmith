/* eslint-disable @typescript-eslint/no-explicit-any */
import generate from "nanoid/generate";
import type { DSLWidget, WidgetProps } from "./types";
import isString from "lodash/isString";

export const DATA_BIND_REGEX_GLOBAL = /{{([\s\S]*?)}}/g;
export const DATA_BIND_REGEX = /{{([\s\S]*?)}}/;

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

export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

// ### JS Action ###

type DataTreeEntity = any;
type JSActionEntity = any;

function getDynamicStringSegments(dynamicString: string): string[] {
  let stringSegments = [];
  const indexOfDoubleParanStart = dynamicString.indexOf("{{");

  if (indexOfDoubleParanStart === -1) {
    return [dynamicString];
  }

  //{{}}{{}}}
  const firstString = dynamicString.substring(0, indexOfDoubleParanStart);

  firstString && stringSegments.push(firstString);
  let rest = dynamicString.substring(
    indexOfDoubleParanStart,
    dynamicString.length,
  );
  //{{}}{{}}}
  let sum = 0;

  for (let i = 0; i <= rest.length - 1; i++) {
    const char = rest[i];
    const prevChar = rest[i - 1];

    if (char === "{") {
      sum++;
    } else if (char === "}") {
      sum--;

      if (prevChar === "}" && sum === 0) {
        stringSegments.push(rest.substring(0, i + 1));
        rest = rest.substring(i + 1, rest.length);

        if (rest) {
          stringSegments = stringSegments.concat(
            getDynamicStringSegments(rest),
          );
          break;
        }
      }
    }
  }

  if (sum !== 0 && dynamicString !== "") {
    return [dynamicString];
  }

  return stringSegments;
}

function isJSAction(entity: DataTreeEntity): entity is JSActionEntity {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === "JSACTION"
  );
}

//{{}}{{}}}
const getDynamicBindings = (
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
