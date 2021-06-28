import _, { VERSION as lodashVersion } from "lodash";
import {
  DATA_BIND_REGEX,
  DATA_BIND_REGEX_GLOBAL,
} from "constants/BindingsConstants";
import { Action } from "entities/Action";
import moment from "moment-timezone";
import { WidgetProps } from "widgets/BaseWidget";
import parser from "fast-xml-parser";
import { Severity } from "entities/AppsmithConsole";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";

export type DependencyMap = Record<string, Array<string>>;

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
  const paths = stringSegments.map((segment) => {
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
  CYCLICAL_DEPENDENCY_ERROR = "CYCLICAL_DEPENDENCY_ERROR",
  EVAL_PROPERTY_ERROR = "EVAL_PROPERTY_ERROR",
  EVAL_TREE_ERROR = "EVAL_TREE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  BAD_UNEVAL_TREE_ERROR = "BAD_UNEVAL_TREE_ERROR",
  EVAL_TRIGGER_ERROR = "EVAL_TRIGGER_ERROR",
}

export type EvalError = {
  type: EvalErrorTypes;
  message: string;
  context?: Record<string, any>;
};

export enum EVAL_WORKER_ACTIONS {
  EVAL_TREE = "EVAL_TREE",
  EVAL_ACTION_BINDINGS = "EVAL_ACTION_BINDINGS",
  EVAL_TRIGGER = "EVAL_TRIGGER",
  CLEAR_PROPERTY_CACHE = "CLEAR_PROPERTY_CACHE",
  CLEAR_PROPERTY_CACHE_OF_WIDGET = "CLEAR_PROPERTY_CACHE_OF_WIDGET",
  CLEAR_CACHE = "CLEAR_CACHE",
  VALIDATE_PROPERTY = "VALIDATE_PROPERTY",
}

export type ExtraLibrary = {
  version: string;
  docsURL: string;
  displayName: string;
  accessor: string;
  lib: any;
};

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
    accessor: "xmlParser",
    lib: parser,
    version: "3.17.5",
    docsURL: "https://github.com/NaturalIntelligence/fast-xml-parser",
    displayName: "xmlParser",
  },
];

export interface DynamicPath {
  key: string;
  value?: string;
}

export interface WidgetDynamicPathListProps {
  dynamicBindingPathList?: DynamicPath[];
  dynamicTriggerPathList?: DynamicPath[];
  dynamicPropertyPathList?: DynamicPath[];
}

export interface EntityWithBindings {
  dynamicBindingPathList?: DynamicPath[];
}

export const getEntityDynamicBindingPathList = (
  entity: EntityWithBindings,
): DynamicPath[] => {
  if (
    entity &&
    entity.dynamicBindingPathList &&
    Array.isArray(entity.dynamicBindingPathList)
  ) {
    return [...entity.dynamicBindingPathList];
  }
  return [];
};

export const isPathADynamicBinding = (
  entity: EntityWithBindings,
  path: string,
): boolean => {
  if (
    entity &&
    entity.dynamicBindingPathList &&
    Array.isArray(entity.dynamicBindingPathList)
  ) {
    return _.find(entity.dynamicBindingPathList, { key: path }) !== undefined;
  }
  return false;
};

export const getWidgetDynamicTriggerPathList = (
  widget: WidgetProps,
): DynamicPath[] => {
  if (
    widget &&
    widget.dynamicTriggerPathList &&
    Array.isArray(widget.dynamicTriggerPathList)
  ) {
    return [...widget.dynamicTriggerPathList];
  }
  return [];
};

export const isPathADynamicTrigger = (
  widget: WidgetProps,
  path: string,
): boolean => {
  if (
    widget &&
    widget.dynamicTriggerPathList &&
    Array.isArray(widget.dynamicTriggerPathList)
  ) {
    return _.find(widget.dynamicTriggerPathList, { key: path }) !== undefined;
  }
  return false;
};

export const getWidgetDynamicPropertyPathList = (
  widget: WidgetProps,
): DynamicPath[] => {
  if (
    widget &&
    widget.dynamicPropertyPathList &&
    Array.isArray(widget.dynamicPropertyPathList)
  ) {
    return [...widget.dynamicPropertyPathList];
  }
  return [];
};

export const isPathADynamicProperty = (
  widget: WidgetProps,
  path: string,
): boolean => {
  if (
    widget &&
    widget.dynamicPropertyPathList &&
    Array.isArray(widget.dynamicPropertyPathList)
  ) {
    return _.find(widget.dynamicPropertyPathList, { key: path }) !== undefined;
  }
  return false;
};

export const unsafeFunctionForEval = [
  "setTimeout",
  "fetch",
  "setInterval",
  "Promise",
];

export const isChildPropertyPath = (
  parentPropertyPath: string,
  childPropertyPath: string,
): boolean =>
  parentPropertyPath === childPropertyPath ||
  childPropertyPath.startsWith(`${parentPropertyPath}.`) ||
  childPropertyPath.startsWith(`${parentPropertyPath}[`);

/**
 * Paths set via evaluator on entities
 * During evaluation, the evaluator will set various data points
 * on the entity objects to describe their state while evaluating.
 * This information can be found on the following paths
 * These paths are meant to be objects with
 * information about the properties in
 * a single place
 *
 * Stored in a flattened object like
 * widget.__evaluation__.errors.primaryColumns.customColumn.computedValue = [...]
 **/
export const EVALUATION_PATH = "__evaluation__";
export const EVAL_ERROR_PATH = `${EVALUATION_PATH}.errors`;
export const EVAL_VALUE_PATH = `${EVALUATION_PATH}.evaluatedValues`;

const getNestedEvalPath = (
  fullPropertyPath: string,
  pathType: string,
  fullPath = true,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(
    fullPropertyPath,
  );
  const nestedPath = `${pathType}.['${propertyPath}']`;
  if (fullPath) {
    return `${entityName}.${nestedPath}`;
  }
  return nestedPath;
};

export const getEvalErrorPath = (fullPropertyPath: string, fullPath = true) => {
  return getNestedEvalPath(fullPropertyPath, EVAL_ERROR_PATH, fullPath);
};

export const getEvalValuePath = (fullPropertyPath: string, fullPath = true) => {
  return getNestedEvalPath(fullPropertyPath, EVAL_VALUE_PATH, fullPath);
};

export enum PropertyEvaluationErrorType {
  VALIDATION = "VALIDATION",
  PARSE = "PARSE",
  LINT = "LINT",
}

export type EvaluationError = {
  raw: string;
  errorType: PropertyEvaluationErrorType;
  errorMessage: string;
  severity: Severity.WARNING | Severity.ERROR;
  errorSegment?: string;
};

export interface DataTreeEvaluationProps {
  __evaluation__?: {
    errors: Record<string, EvaluationError[]>;
    evaluatedValues?: Record<string, unknown>;
  };
}

export const PropertyEvalErrorTypeDebugMessage: Record<
  PropertyEvaluationErrorType,
  (propertyPath: string) => string
> = {
  [PropertyEvaluationErrorType.VALIDATION]: (propertyPath: string) =>
    `The value at ${propertyPath} is invalid`,
  [PropertyEvaluationErrorType.PARSE]: () => `Could not parse the binding`,
  [PropertyEvaluationErrorType.LINT]: () => `Errors found while evaluating`,
};
