import _ from "lodash";
import {
  DATA_BIND_REGEX,
  DATA_BIND_REGEX_GLOBAL,
} from "constants/BindingsConstants";
import JSExecutionManagerSingleton, {
  JSExecutorResult,
} from "jsExecution/JSExecutionManagerSingleton";
import unescapeJS from "unescape-js";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Action } from "entities/Action";

type StringTuple = [string, string];

export const removeBindingsFromActionObject = (obj: Action) => {
  const string = JSON.stringify(obj);
  const withBindings = string.replace(DATA_BIND_REGEX_GLOBAL, "{{ }}");
  return JSON.parse(withBindings);
};
// referencing DATA_BIND_REGEX fails for the value "{{Table1.tableData[Table1.selectedRowIndex]}}" if you run it multiple times and don't recreate
export const isDynamicValue = (value: string): boolean =>
  DATA_BIND_REGEX.test(value);

//{{}}{{}}}
export function getDynamicStringSegments(dynamicString: string): string[] {
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

export const getDynamicBindings = (
  dynamicString: string,
): { stringSegments: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !_.isString(dynamicString)) {
    return { stringSegments: [], jsSnippets: [] };
  }
  const sanitisedString = dynamicString.trim();
  // Get the {{binding}} bound values
  const stringSegments = getDynamicStringSegments(sanitisedString);
  // Get the "binding" path values
  const paths = stringSegments.map(segment => {
    const length = segment.length;
    const matches = isDynamicValue(segment);
    if (matches) {
      return segment.substring(2, length - 2);
    }
    return "";
  });
  return { stringSegments: stringSegments, jsSnippets: paths };
};

// Paths are expected to have "{name}.{path}" signature
// Also returns any action triggers found after evaluating value
export const evaluateDynamicBoundValue = (
  data: DataTree,
  path: string,
  callbackData?: any,
): JSExecutorResult => {
  const unescapedJS = unescapeJS(path).replace(/(\r\n|\n|\r)/gm, "");
  return JSExecutionManagerSingleton.evaluateSync(
    unescapedJS,
    data,
    callbackData,
  );
};
