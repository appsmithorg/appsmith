import _, { get, isString, VERSION as lodashVersion } from "lodash";
import { DATA_BIND_REGEX } from "constants/BindingsConstants";
import { Action } from "entities/Action";
import moment from "moment-timezone";
import { WidgetProps } from "widgets/BaseWidget";
import parser from "fast-xml-parser";
import { Severity } from "entities/AppsmithConsole";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
  isTrueObject,
} from "workers/evaluationUtils";
import forge from "node-forge";
import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { getType, Types } from "./TypeHelpers";
import { ViewTypes } from "components/formControls/utils";

export type DependencyMap = Record<string, Array<string>>;
export type FormEditorConfigs = Record<string, any[]>;
export type FormSettingsConfigs = Record<string, any[]>;
export type FormDependencyConfigs = Record<string, DependencyMap>;
export type FormDatasourceButtonConfigs = Record<string, string[]>;

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

//{{}}{{}}}
export const getDynamicBindings = (
  dynamicString: string,
  entity?: DataTreeEntity,
): { stringSegments: string[]; jsSnippets: string[] } => {
  // Protect against bad string parse
  if (!dynamicString || !_.isString(dynamicString)) {
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

export const combineDynamicBindings = (
  jsSnippets: string[],
  stringSegments: string[],
) => {
  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(" + ");
};

export enum EvalErrorTypes {
  CYCLICAL_DEPENDENCY_ERROR = "CYCLICAL_DEPENDENCY_ERROR",
  EVAL_PROPERTY_ERROR = "EVAL_PROPERTY_ERROR",
  EVAL_TREE_ERROR = "EVAL_TREE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  BAD_UNEVAL_TREE_ERROR = "BAD_UNEVAL_TREE_ERROR",
  PARSE_JS_ERROR = "PARSE_JS_ERROR",
  CLONE_ERROR = "CLONE_ERROR",
  EXTRACT_DEPENDENCY_ERROR = "EXTRACT_DEPENDENCY_ERROR",
}

export type EvalError = {
  type: EvalErrorTypes;
  message: string;
  context?: Record<string, any>;
};

export enum EVAL_WORKER_ACTIONS {
  SETUP = "SETUP",
  EVAL_TREE = "EVAL_TREE",
  EVAL_ACTION_BINDINGS = "EVAL_ACTION_BINDINGS",
  EVAL_TRIGGER = "EVAL_TRIGGER",
  PROCESS_TRIGGER = "PROCESS_TRIGGER",
  CLEAR_CACHE = "CLEAR_CACHE",
  VALIDATE_PROPERTY = "VALIDATE_PROPERTY",
  UNDO = "undo",
  REDO = "redo",
  EVAL_EXPRESSION = "EVAL_EXPRESSION",
  UPDATE_REPLAY_OBJECT = "UPDATE_REPLAY_OBJECT",
  SET_EVALUATION_VERSION = "SET_EVALUATION_VERSION",
  INIT_FORM_EVAL = "INIT_FORM_EVAL",
  EXECUTE_SYNC_JS = "EXECUTE_SYNC_JS",
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
  {
    accessor: "forge",
    // We are removing some functionalities of node-forge because they wont
    // work in the worker thread
    lib: _.omit(forge, ["tls", "http", "xhr", "socket", "task"]),
    version: "1.3.0",
    docsURL: "https://github.com/digitalbazaar/forge",
    displayName: "forge",
  },
];

/**
 * creates dynamic list of constants based on
 * current list of extra libraries i.e lodash("_"), moment etc
 * to be used in widget and entity name validations
 */
export const extraLibrariesNames = extraLibraries.reduce(
  (prev: any, curr: any) => {
    prev[curr.accessor] = curr.accessor;
    return prev;
  },
  {},
);

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
/**
 * Get property path from full property path
 * Input: "Table1.meta.searchText" => Output: "meta.searchText"
 * @param {string} fullPropertyPath
 * @return {*}
 */
export const getPropertyPath = (fullPropertyPath: string) => {
  return fullPropertyPath.substring(fullPropertyPath.indexOf(".") + 1);
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

export const THEME_BINDING_REGEX = /{{.*appsmith\.theme\..*}}/;

export const isThemeBoundProperty = (
  widget: WidgetProps,
  path: string,
): boolean => {
  return widget && widget[path] && THEME_BINDING_REGEX.test(widget[path]);
};

export const unsafeFunctionForEval = [
  "setTimeout",
  "fetch",
  "setInterval",
  "clearInterval",
  "setImmediate",
  "XMLHttpRequest",
  "importScripts",
  "Navigator",
];

export const isChildPropertyPath = (
  parentPropertyPath: string,
  childPropertyPath: string,
): boolean => {
  return (
    parentPropertyPath === childPropertyPath ||
    childPropertyPath.startsWith(`${parentPropertyPath}.`) ||
    childPropertyPath.startsWith(`${parentPropertyPath}[`)
  );
};

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

/**
 * non-populated object 
 {
   __evaluation__:{
     evaluatedValues:{
       primaryColumns: [...],
       primaryColumns.status: {...},
       primaryColumns.action: {...}
     }
   }
 }

 * Populated Object
 {
   __evaluation__:{
     evaluatedValues:{
       primaryColumns: {
         status: [...],
         action:[...]
        }
     }
   }
 }

 */
const getNestedEvalPath = (
  fullPropertyPath: string,
  pathType: string,
  fullPath = true,
  isPopulated = false,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(
    fullPropertyPath,
  );
  const nestedPath = isPopulated
    ? `${pathType}.${propertyPath}`
    : `${pathType}.['${propertyPath}']`;

  if (fullPath) {
    return `${entityName}.${nestedPath}`;
  }
  return nestedPath;
};

export const getEvalErrorPath = (
  fullPropertyPath: string,
  options = {
    fullPath: true,
    isPopulated: false,
  },
) => {
  return getNestedEvalPath(
    fullPropertyPath,
    EVAL_ERROR_PATH,
    options.fullPath,
    options.isPopulated,
  );
};

export const getEvalValuePath = (
  fullPropertyPath: string,
  options = {
    fullPath: true,
    isPopulated: false,
  },
) => {
  return getNestedEvalPath(
    fullPropertyPath,
    EVAL_VALUE_PATH,
    options.fullPath,
    options.isPopulated,
  );
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
  originalBinding?: string;
  variables?: (string | undefined | null)[];
  code?: string;
  line?: number;
  ch?: number;
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

// this variable temporarily holds dynamic paths generated by the recursive function (getDynamicValuePaths - Line 468).
let temporaryDynamicPathStore: DynamicPath[] = [];

// recursive function to get full key path of any object that has dynamic bindings.
const getDynamicValuePaths = (val: any, parentPath: string) => {
  if (isString(val) && isDynamicValue(val)) {
    return temporaryDynamicPathStore.push({ key: `${parentPath}` });
  }

  if (Array.isArray(val)) {
    val.forEach((obj, index) => {
      return getDynamicValuePaths(obj, `${parentPath}[${index}]`);
    });
  }

  if (isTrueObject(val)) {
    Object.entries(val).forEach(([key, value]) => {
      getDynamicValuePaths(value, `${parentPath}.${key}`);
    });
  }
};

export function getDynamicBindingsChangesSaga(
  action: Action,
  value: unknown,
  field: string,
) {
  const bindingField = field.replace("actionConfiguration.", "");
  // we listen to any viewType changes.
  const viewType = field.endsWith(".viewType");
  let dynamicBindings: DynamicPath[] = action.dynamicBindingPathList || [];

  if (field.endsWith(".jsonData") || field.endsWith(".componentData")) {
    return dynamicBindings;
  }

  if (
    action.datasource &&
    "datasourceConfiguration" in action.datasource &&
    field === "datasource"
  ) {
    // only the datasource.datasourceConfiguration.url can be a dynamic field
    dynamicBindings = dynamicBindings.filter(
      (binding) => binding.key !== "datasourceUrl",
    );
    const datasourceUrl = action.datasource.datasourceConfiguration.url;
    isDynamicValue(datasourceUrl) &&
      dynamicBindings.push({ key: "datasourceUrl" });
    return dynamicBindings;
  }

  // When a key-value pair is added or deleted from a fieldArray
  // Value is an Array representing the new fieldArray.

  if (Array.isArray(value)) {
    // first we clear the dynamic bindings of any paths that is a child of the current path.
    dynamicBindings = dynamicBindings.filter(
      (binding) => !isChildPropertyPath(bindingField, binding.key),
    );

    // then we recursively go through the value and find paths with dynamic bindings
    temporaryDynamicPathStore = [];
    if (!!value) {
      getDynamicValuePaths(value, bindingField);
    }
    if (!!temporaryDynamicPathStore && temporaryDynamicPathStore.length > 0) {
      dynamicBindings = [...dynamicBindings, ...temporaryDynamicPathStore];
    }
  } else if (getType(value) === Types.OBJECT) {
    dynamicBindings = dynamicBindings.filter((dynamicPath) => {
      if (isChildPropertyPath(bindingField, dynamicPath.key)) {
        const childPropertyValue = _.get(value, dynamicPath.key);
        return isDynamicValue(childPropertyValue);
      }
    });
  } else if (typeof value === "string") {
    const fieldExists = _.some(dynamicBindings, { key: bindingField });

    const isDynamic = isDynamicValue(value);

    if (!isDynamic && fieldExists) {
      dynamicBindings = dynamicBindings.filter((d) => d.key !== bindingField);
    }
    if (isDynamic && !fieldExists) {
      dynamicBindings.push({ key: bindingField });
    }
  }

  // the reason this is done is to change the dynamicBindingsPathlist of a component when a user toggles the form control
  // from component mode to json mode and vice versa.

  // when in json mode, we want to get rid of all the existing componentData paths and replace it with a single path for the json mode
  // for example: [{key: 'formData.sortBy.data[0].column'}, {key: 'formData.sortBy.data[1].column'}] will be replaced with just this [{key: 'formData.sortBy.data'}]

  // when in component mode, we want to first remove all the paths for json mode and
  //  get back all the paths in the componentData that have dynamic bindings and add them to the the dynamic bindings pathlist.
  // for example: [{key: 'formData.sortBy.data'}] will be replaced with this [{key: 'formData.sortBy.data[0].column'}, {key: 'formData.sortBy.data[1].column'}]

  // if the currently changing field is a component's view type
  if (!!viewType) {
    const dataBindingField = bindingField.replace(".viewType", ".data");
    // then we filter the field of any paths that includes the binding fields
    dynamicBindings = dynamicBindings.filter(
      (dynamicPath) => !dynamicPath?.key?.includes(dataBindingField),
    );

    // if the value of the viewType is of json and, we push in the field
    if (value === ViewTypes.JSON) {
      const jsonFieldPath = field.replace(".viewType", ".jsonData");
      const jsonFieldValue = get(action, jsonFieldPath);
      if (isDynamicValue(jsonFieldValue)) {
        dynamicBindings.push({ key: dataBindingField });
      }
    } else if (value === ViewTypes.COMPONENT) {
      const componentFieldPath = field.replace(".viewType", ".componentData");
      const componentFieldValue = get(action, componentFieldPath);
      temporaryDynamicPathStore = [];

      if (!!componentFieldValue) {
        getDynamicValuePaths(componentFieldValue, dataBindingField);
      }
      if (!!temporaryDynamicPathStore && temporaryDynamicPathStore.length > 0) {
        dynamicBindings = [...dynamicBindings, ...temporaryDynamicPathStore];
      }
    }
  }
  return dynamicBindings;
}
