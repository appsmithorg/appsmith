import _, { VERSION as lodashVersion } from "lodash";
import {
  DATA_BIND_REGEX,
  DATA_BIND_REGEX_GLOBAL,
} from "constants/BindingsConstants";
import { Action } from "entities/Action";
import moment from "moment-timezone";
import { atob, btoa, version as BASE64LIBVERSION } from "js-base64";
import { ExtraLibrary } from "../jsExecution/JSExecutionManagerSingleton";

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

export enum EvalErrorTypes {
  DEPENDENCY_ERROR = "DEPENDENCY_ERROR",
  EVAL_PROPERTY_ERROR = "EVAL_PROPERTY_ERROR",
  EVAL_TREE_ERROR = "EVAL_TREE_ERROR",
  UNESCAPE_STRING_ERROR = "UNESCAPE_STRING_ERROR",
  EVAL_ERROR = "EVAL_ERROR",
}

export type EvalError = {
  type: EvalErrorTypes;
  error: Error;
  context?: Record<string, any>;
};

export enum EVAL_WORKER_ACTIONS {
  EVAL_TREE = "EVAL_TREE",
  EVAL_SINGLE = "EVAL_SINGLE",
  EVAL_TRIGGER = "EVAL_TRIGGER",
  CLEAR_PROPERTY_CACHE = "CLEAR_PROPERTY_CACHE",
  CLEAR_CACHE = "CLEAR_CACHE",
}

export const extraLibraries: ExtraLibrary[] = [
  {
    accessor: "_",
    lib: _,
    version: lodashVersion,
    docsURL: `https://lodash.com/docs/${lodashVersion}`,
    displayName: "lodash",
  },
  {
    accessor: "moment",
    lib: moment,
    version: moment.version,
    docsURL: `https://momentjs.com/docs/`,
    displayName: "moment",
  },
  {
    accessor: "btoa",
    lib: btoa,
    version: BASE64LIBVERSION,
    docsURL: "https://github.com/dankogai/js-base64#readme",
    displayName: "btoa",
  },
  {
    accessor: "atob",
    lib: atob,
    version: BASE64LIBVERSION,
    docsURL: "https://github.com/dankogai/js-base64#readme",
    displayName: "atob",
  },
];
