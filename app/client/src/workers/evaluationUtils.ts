import {
  DependencyMap,
  EVAL_ERROR_PATH,
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  isChildPropertyPath,
  isDynamicValue,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { validate } from "./validations";
import { Diff } from "deep-diff";
import {
  DataTree,
  DataTreeAction,
  DataTreeAppsmith,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
  DataTreeJSAction,
  EvaluationSubstitutionType,
  PrivateWidgets,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { Severity } from "entities/AppsmithConsole";
import { ParsedBody, ParsedJSSubAction } from "utils/JSPaneUtils";
import { Variable } from "entities/JSCollection";
const clone = require("rfdc/default");

// Dropdown1.options[1].value -> Dropdown1.options[1]
// Dropdown1.options[1] -> Dropdown1.options
// Dropdown1.options -> Dropdown1
export const IMMEDIATE_PARENT_REGEX = /^(.*)(\..*|\[.*\])$/;

export enum DataTreeDiffEvent {
  NEW = "NEW",
  DELETE = "DELETE",
  EDIT = "EDIT",
  NOOP = "NOOP",
}

export type DataTreeDiff = {
  payload: {
    propertyPath: string;
    value?: string;
  };
  event: DataTreeDiffEvent;
};

export class CrashingError extends Error {}

export const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach((segment) => {
    if (isInt(segment)) {
      string = string + "[" + segment + "]";
    } else {
      if (string.length !== 0) {
        string = string + ".";
      }
      string = string + segment;
    }
  });
  return string;
};

// Todo: improve the logic here
// Right now NaN, Infinity, floats, everything works
function isInt(val: string | number): boolean {
  return Number.isInteger(val) || (_.isString(val) && /^\d+$/.test(val));
}

// Removes the entity name from the property path
export function getEntityNameAndPropertyPath(
  fullPath: string,
): {
  entityName: string;
  propertyPath: string;
} {
  const indexOfFirstDot = fullPath.indexOf(".");
  if (indexOfFirstDot === -1) {
    // No dot was found so path is the entity name itself
    return {
      entityName: fullPath,
      propertyPath: "",
    };
  }
  const entityName = fullPath.substring(0, indexOfFirstDot);
  const propertyPath = fullPath.substring(indexOfFirstDot + 1);
  return { entityName, propertyPath };
}

export const translateDiffEventToDataTreeDiffEvent = (
  difference: Diff<any, any>,
  unEvalDataTree: DataTree,
): DataTreeDiff | DataTreeDiff[] => {
  let result: DataTreeDiff | DataTreeDiff[] = {
    payload: {
      propertyPath: "",
      value: "",
    },
    event: DataTreeDiffEvent.NOOP,
  };
  if (!difference.path) {
    return result;
  }
  const propertyPath = convertPathToString(difference.path);
  const { entityName } = getEntityNameAndPropertyPath(propertyPath);
  const entity = unEvalDataTree[entityName];
  const isJsAction = isJSAction(entity);
  switch (difference.kind) {
    case "N": {
      result.event = DataTreeDiffEvent.NEW;
      result.payload = {
        propertyPath,
      };
      break;
    }
    case "D": {
      result.event = DataTreeDiffEvent.DELETE;
      result.payload = { propertyPath };
      break;
    }
    case "E": {
      let rhsChange, lhsChange;
      if (isJsAction) {
        rhsChange = typeof difference.rhs === "string";
        lhsChange = typeof difference.lhs === "string";
      } else {
        rhsChange =
          typeof difference.rhs === "string" && isDynamicValue(difference.rhs);

        lhsChange =
          typeof difference.lhs === "string" && isDynamicValue(difference.lhs);
      }

      if (rhsChange || lhsChange) {
        result.event = DataTreeDiffEvent.EDIT;
        result.payload = {
          propertyPath,
          value: difference.rhs,
        };
      } else if (difference.lhs === undefined || difference.rhs === undefined) {
        // Handle static value changes that change structure that can lead to
        // old bindings being eligible
        if (difference.lhs === undefined && isTrueObject(difference.rhs)) {
          result.event = DataTreeDiffEvent.NEW;
          result.payload = { propertyPath };
        }
        if (difference.rhs === undefined && isTrueObject(difference.lhs)) {
          result.event = DataTreeDiffEvent.DELETE;
          result.payload = { propertyPath };
        }
      } else if (
        isTrueObject(difference.lhs) &&
        !isTrueObject(difference.rhs)
      ) {
        // This will happen for static value changes where a property went
        // from being an object to any other type like string or number
        // in such a case we want to delete all nested paths of the
        // original lhs object

        result = Object.keys(difference.lhs).map((diffKey) => {
          const path = `${propertyPath}.${diffKey}`;
          return {
            event: DataTreeDiffEvent.DELETE,
            payload: {
              propertyPath: path,
            },
          };
        });
      } else if (
        !isTrueObject(difference.lhs) &&
        isTrueObject(difference.rhs)
      ) {
        // This will happen for static value changes where a property went
        // from being any other type like string or number to an object
        // in such a case we want to add all nested paths of the
        // new rhs object
        result = Object.keys(difference.rhs).map((diffKey) => {
          const path = `${propertyPath}.${diffKey}`;
          return {
            event: DataTreeDiffEvent.NEW,
            payload: {
              propertyPath: path,
            },
          };
        });
      }
      break;
    }
    case "A": {
      return translateDiffEventToDataTreeDiffEvent(
        {
          ...difference.item,
          path: [...difference.path, difference.index],
        },
        unEvalDataTree,
      );
    }
    default: {
      break;
    }
  }
  return result;
};

/*
  Table1.selectedRow
  Table1.selectedRow.email: ["Input1.defaultText"]
 */

export const addDependantsOfNestedPropertyPaths = (
  parentPaths: Array<string>,
  inverseMap: DependencyMap,
): Set<string> => {
  const withNestedPaths: Set<string> = new Set();
  const dependantNodes = Object.keys(inverseMap);
  parentPaths.forEach((propertyPath) => {
    withNestedPaths.add(propertyPath);
    dependantNodes
      .filter((dependantNodePath) =>
        isChildPropertyPath(propertyPath, dependantNodePath),
      )
      .forEach((dependantNodePath) => {
        inverseMap[dependantNodePath].forEach((path) => {
          withNestedPaths.add(path);
        });
      });
  });
  return withNestedPaths;
};

export function isWidget(entity: DataTreeEntity): entity is DataTreeWidget {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET
  );
}

export function isAction(entity: DataTreeEntity): entity is DataTreeAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.ACTION
  );
}

export function isAppsmithEntity(
  entity: DataTreeEntity,
): entity is DataTreeAppsmith {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.APPSMITH
  );
}

export function isJSAction(entity: DataTreeEntity): entity is DataTreeJSAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION
  );
}

// We need to remove functions from data tree to avoid any unexpected identifier while JSON parsing
// Check issue https://github.com/appsmithorg/appsmith/issues/719
export const removeFunctions = (value: any) => {
  if (_.isFunction(value)) {
    return "Function call";
  } else if (_.isObject(value)) {
    return JSON.parse(
      JSON.stringify(value, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    );
  } else {
    return value;
  }
};

export const makeParentsDependOnChildren = (
  depMap: DependencyMap,
): DependencyMap => {
  //return depMap;
  // Make all parents depend on child
  Object.keys(depMap).forEach((key) => {
    depMap = makeParentsDependOnChild(depMap, key);
    depMap[key].forEach((path) => {
      depMap = makeParentsDependOnChild(depMap, path);
    });
  });
  return depMap;
};

export const makeParentsDependOnChild = (
  depMap: DependencyMap,
  child: string,
): DependencyMap => {
  const result: DependencyMap = depMap;
  let curKey = child;

  let matches: Array<string> | null;
  // Note: The `=` is intentional
  // Stops looping when match is null
  while ((matches = curKey.match(IMMEDIATE_PARENT_REGEX)) !== null) {
    const parentKey = matches[1];
    // Todo: switch everything to set.
    const existing = new Set(result[parentKey] || []);
    existing.add(curKey);
    result[parentKey] = Array.from(existing);
    curKey = parentKey;
  }
  return result;
};

// The idea is to find the immediate parents of the property paths
// e.g. For Table1.selectedRow.email, the parent is Table1.selectedRow
export const getImmediateParentsOfPropertyPaths = (
  propertyPaths: Array<string>,
): Array<string> => {
  // Use a set to ensure that we dont have duplicates
  const parents: Set<string> = new Set();

  propertyPaths.forEach((path) => {
    const matches = path.match(IMMEDIATE_PARENT_REGEX);

    if (matches !== null) {
      parents.add(matches[1]);
    }
  });

  return Array.from(parents);
};

export function validateWidgetProperty(
  config: ValidationConfig,
  value: unknown,
  props: Record<string, unknown>,
) {
  if (!config) {
    return {
      isValid: true,
      parsed: value,
    };
  }
  return validate(config, value, props);
}

export function validateActionProperty(
  config: ValidationConfig,
  value: unknown,
) {
  if (!config) {
    return {
      isValid: true,
      parsed: value,
    };
  }
  return validate(config, value, {});
}

export function getValidatedTree(tree: DataTree) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const parsedEntity = { ...entity };
    Object.entries(entity.validationPaths).forEach(([property, validation]) => {
      const value = _.get(entity, property);
      // Pass it through parse
      const { isValid, messages, parsed, transformed } = validateWidgetProperty(
        validation,
        value,
        entity,
      );
      _.set(parsedEntity, property, parsed);
      const evaluatedValue = isValid
        ? parsed
        : _.isUndefined(transformed)
        ? value
        : transformed;
      const safeEvaluatedValue = removeFunctions(evaluatedValue);
      _.set(
        parsedEntity,
        getEvalValuePath(`${entityKey}.${property}`, false),
        safeEvaluatedValue,
      );
      if (!isValid) {
        const evalErrors: EvaluationError[] =
          messages?.map((message) => ({
            errorType: PropertyEvaluationErrorType.VALIDATION,
            errorMessage: message,
            severity: Severity.ERROR,
            raw: value,
          })) ?? [];
        addErrorToEntityProperty(
          evalErrors,
          tree,
          getEvalErrorPath(`${entityKey}.${property}`, false),
        );
      }
    });
    return { ...tree, [entityKey]: parsedEntity };
  }, tree);
}

export const getAllPaths = (
  records: any,
  curKey = "",
  result: Record<string, true> = {},
): Record<string, true> => {
  // Add the key if it exists
  if (curKey) result[curKey] = true;
  if (Array.isArray(records)) {
    for (let i = 0; i < records.length; i++) {
      const tempKey = curKey ? `${curKey}[${i}]` : `${i}`;
      getAllPaths(records[i], tempKey, result);
    }
  } else if (typeof records === "object") {
    for (const key in records) {
      const tempKey = curKey ? `${curKey}.${key}` : `${key}`;
      getAllPaths(records[key], tempKey, result);
    }
  }
  return result;
};
export const trimDependantChangePaths = (
  changePaths: Set<string>,
  dependencyMap: DependencyMap,
): Array<string> => {
  const trimmedPaths = [];
  for (const path of changePaths) {
    let foundADependant = false;
    if (path in dependencyMap) {
      const dependants = dependencyMap[path];
      for (const dependantPath of dependants) {
        if (changePaths.has(dependantPath)) {
          foundADependant = true;
          break;
        }
      }
    }
    if (!foundADependant) {
      trimmedPaths.push(path);
    }
  }
  return trimmedPaths;
};

export function getSafeToRenderDataTree(
  tree: DataTree,
  widgetTypeConfigMap: WidgetTypeConfigMap,
) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const safeToRenderEntity = { ...entity };
    // Set user input values to their parsed values
    Object.entries(entity.validationPaths).forEach(([property, validation]) => {
      const value = _.get(entity, property);
      // Pass it through parse
      const { parsed } = validateWidgetProperty(validation, value, entity);
      _.set(safeToRenderEntity, property, parsed);
    });
    // Set derived values to undefined or else they would go as bindings
    Object.keys(widgetTypeConfigMap[entity.type].derivedProperties).forEach(
      (property) => {
        _.set(safeToRenderEntity, property, undefined);
      },
    );
    return { ...tree, [entityKey]: safeToRenderEntity };
  }, tree);
}

export const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
export const ARGUMENT_NAMES = /([^\s,]+)/g;

export function getParams(func: any) {
  const fnStr = func.toString().replace(STRIP_COMMENTS, "");
  const args: Array<Variable> = [];
  let result = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);
  if (result === null) result = [];
  if (result && result.length) {
    result.forEach((arg: string) => {
      const element = arg.split("=");
      args.push({
        name: element[0],
        value: element[1],
      });
    });
  }
  return args;
}

export const addErrorToEntityProperty = (
  errors: EvaluationError[],
  dataTree: DataTree,
  path: string,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
  const logBlackList = _.get(dataTree, `${entityName}.logBlackList`, {});
  if (propertyPath && !(propertyPath in logBlackList)) {
    const existingErrors = _.get(
      dataTree,
      `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`,
      [],
    ) as EvaluationError[];
    _.set(
      dataTree,
      `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`,
      existingErrors.concat(errors),
    );
  }
  return dataTree;
};

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (
  item: unknown,
): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

export const isDynamicLeaf = (unEvalTree: DataTree, propertyPath: string) => {
  const [entityName, ...propPathEls] = _.toPath(propertyPath);
  // Framework feature: Top level items are never leaves
  if (entityName === propertyPath) return false;
  // Ignore if this was a delete op
  if (!(entityName in unEvalTree)) return false;

  const entity = unEvalTree[entityName];
  if (!isAction(entity) && !isWidget(entity) && !isJSAction(entity))
    return false;
  const relativePropertyPath = convertPathToString(propPathEls);
  return (
    relativePropertyPath in entity.bindingPaths ||
    (isWidget(entity) && relativePropertyPath in entity.triggerPaths)
  );
};

export const updateJSCollectionInDataTree = (
  parsedBody: ParsedBody,
  jsCollection: DataTreeJSAction,
  dataTree: DataTree,
) => {
  const modifiedDataTree: any = dataTree;
  const functionsList: Array<string> = [];
  const varList: Array<string> = jsCollection.variables;
  Object.keys(jsCollection.meta).forEach((action) => {
    functionsList.push(action);
  });

  if (parsedBody.actions && parsedBody.actions.length > 0) {
    for (let i = 0; i < parsedBody.actions.length; i++) {
      const action = parsedBody.actions[i];
      if (jsCollection.hasOwnProperty(action.name)) {
        if (jsCollection[action.name] !== action.body) {
          _.set(
            modifiedDataTree,
            `${jsCollection.name}.${action.name}`,
            action.body,
          );
        }
      } else {
        const bindingPaths = jsCollection.bindingPaths;
        bindingPaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
        _.set(modifiedDataTree, `${jsCollection}.bindingPaths`, bindingPaths);
        const dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList.push({ key: action.name });
        _.set(
          modifiedDataTree,
          `${jsCollection}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );
        const dependencyMap = jsCollection.dependencyMap;
        dependencyMap["body"].push(action.name);
        _.set(modifiedDataTree, `${jsCollection}.dependencyMap`, dependencyMap);
        const meta = jsCollection.meta;
        meta[action.name] = { arguments: action.arguments };
        _.set(modifiedDataTree, `${jsCollection.name}.meta`, meta);
        _.set(
          modifiedDataTree,
          `${jsCollection.name}.${action.name}`,
          action.body,
        );
      }
    }
  }
  if (functionsList && functionsList.length > 0) {
    for (let i = 0; i < functionsList.length; i++) {
      const preAction = functionsList[i];
      const existed = parsedBody.actions.find(
        (js: ParsedJSSubAction) => js.name === preAction,
      );
      if (!existed) {
        const bindingPaths = jsCollection.bindingPaths;
        delete bindingPaths[preAction];
        _.set(
          modifiedDataTree,
          `${jsCollection.name}.bindingPaths`,
          bindingPaths,
        );
        let dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList = dynamicBindingPathList.filter(
          (path) => path["key"] !== preAction,
        );
        _.set(
          modifiedDataTree,
          `${jsCollection.name}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );
        const dependencyMap = jsCollection.dependencyMap["body"];
        const removeIndex = dependencyMap.indexOf(preAction);
        if (removeIndex > -1) {
          const updatedDMap = dependencyMap.filter(
            (item) => item !== preAction,
          );
          _.set(
            modifiedDataTree,
            `${jsCollection.name}.dependencyMap.body`,
            updatedDMap,
          );
        }
        const meta = jsCollection.meta;
        delete meta[preAction];
        _.set(modifiedDataTree, `${jsCollection.name}.meta`, meta);
        delete modifiedDataTree[`${jsCollection.name}`][`${preAction}`];
      }
    }
  }
  if (parsedBody.variables.length) {
    for (let i = 0; i < parsedBody.variables.length; i++) {
      const newVar = parsedBody.variables[i];
      const existedVar = varList.indexOf(newVar.name);
      if (existedVar > -1) {
        const existedVarVal = jsCollection[newVar.name];
        if (
          (!!existedVarVal && existedVarVal.toString()) !==
            (newVar.value && newVar.value.toString()) ||
          (!existedVarVal && !!newVar)
        ) {
          _.set(
            modifiedDataTree,
            `${jsCollection.name}.${newVar.name}`,
            newVar.value,
          );
        }
      } else {
        varList.push(newVar.name);
        _.set(modifiedDataTree, `${jsCollection.name}.variables`, varList);
        _.set(
          modifiedDataTree,
          `${jsCollection.name}.${newVar.name}`,
          newVar.value,
        );
      }
    }
    let newVarList: Array<string> = [];
    for (let i = 0; i < varList.length; i++) {
      const varListItem = varList[i];
      const existsInParsed = parsedBody.variables.find(
        (item) => item.name === varListItem,
      );
      if (!existsInParsed) {
        delete modifiedDataTree[`${jsCollection.name}`][`${varListItem}`];
        newVarList = varList.filter((item) => item !== varListItem);
      }
    }
    if (newVarList.length) {
      _.set(modifiedDataTree, `${jsCollection.name}.variables`, newVarList);
    }
  }
  return modifiedDataTree;
};

export const removeFunctionsAndVariableJSCollection = (
  dataTree: DataTree,
  entity: DataTreeJSAction,
) => {
  const modifiedDataTree: any = dataTree;
  const functionsList: Array<string> = [];
  Object.keys(entity.meta).forEach((action) => {
    functionsList.push(action);
  });
  //removed variables
  const varList: Array<string> = entity.variables;
  _.set(modifiedDataTree, `${entity.name}.variables`, []);
  for (let i = 0; i < varList.length; i++) {
    const varName = varList[i];
    delete modifiedDataTree[`${entity.name}`][`${varName}`];
  }
  //remove functions
  let dynamicBindingPathList = entity.dynamicBindingPathList;
  const bindingPaths = entity.bindingPaths;
  const meta = entity.meta;
  let dependencyMap = entity.dependencyMap["body"];
  for (let i = 0; i < functionsList.length; i++) {
    const actionName = functionsList[i];
    delete bindingPaths[actionName];
    delete meta[actionName];
    delete modifiedDataTree[`${entity.name}`][`${actionName}`];
    dynamicBindingPathList = dynamicBindingPathList.filter(
      (path: any) => path["key"] !== actionName,
    );
    dependencyMap = dependencyMap.filter((item: any) => item !== actionName);
  }
  _.set(modifiedDataTree, `${entity.name}.bindingPaths`, bindingPaths);
  _.set(
    modifiedDataTree,
    `${entity.name}.dynamicBindingPathList`,
    dynamicBindingPathList,
  );
  _.set(modifiedDataTree, `${entity.name}.dependencyMap.body`, dependencyMap);
  _.set(modifiedDataTree, `${entity.name}.meta`, meta);
  return modifiedDataTree;
};

export const addWidgetPropertyDependencies = ({
  entity,
  entityName,
}: {
  entity: DataTreeWidget;
  entityName: string;
}) => {
  const dependencies: DependencyMap = {};

  Object.entries(entity.propertyOverrideDependency).forEach(
    ([overriddenPropertyKey, overridingPropertyKeyMap]) => {
      const existingDependenciesSet = new Set(
        dependencies[`${entityName}.${overriddenPropertyKey}`] || [],
      );
      // add meta dependency
      overridingPropertyKeyMap.META &&
        existingDependenciesSet.add(
          `${entityName}.${overridingPropertyKeyMap.META}`,
        );
      // add default dependency
      overridingPropertyKeyMap.DEFAULT &&
        existingDependenciesSet.add(
          `${entityName}.${overridingPropertyKeyMap.DEFAULT}`,
        );

      dependencies[`${entityName}.${overriddenPropertyKey}`] = [
        ...existingDependenciesSet,
      ];
    },
  );
  return dependencies;
};

export const isPrivateEntityPath = (
  privateWidgets: PrivateWidgets,
  fullPropertyPath: string,
) => {
  const entityName = fullPropertyPath.split(".")[0];
  if (Object.keys(privateWidgets).indexOf(entityName) !== -1) {
    return true;
  }
  return false;
};

export const getAllPrivateWidgetsInDataTree = (
  dataTree: DataTree,
): PrivateWidgets => {
  let privateWidgets: PrivateWidgets = {};

  Object.keys(dataTree).forEach((entityName) => {
    const entity = dataTree[entityName];
    if (isWidget(entity) && !_.isEmpty(entity.privateWidgets)) {
      privateWidgets = { ...privateWidgets, ...entity.privateWidgets };
    }
  });

  return privateWidgets;
};

export const getDataTreeWithoutPrivateWidgets = (
  dataTree: DataTree,
): DataTree => {
  const privateWidgets = getAllPrivateWidgetsInDataTree(dataTree);
  const privateWidgetNames = Object.keys(privateWidgets);
  const treeWithoutPrivateWidgets = _.omit(dataTree, privateWidgetNames);
  return treeWithoutPrivateWidgets;
};

export const overrideWidgetProperties = (
  entity: DataTreeWidget,
  propertyPath: string,
  value: unknown,
  currentTree: DataTree,
) => {
  const clonedValue = clone(value);
  if (propertyPath in entity.overridingPropertyPaths) {
    const overridingPropertyPaths =
      entity.overridingPropertyPaths[propertyPath];

    overridingPropertyPaths.forEach((overriddenPropertyPath) => {
      const overriddenPropertyPathArray = overriddenPropertyPath.split(".");
      _.set(
        currentTree,
        [entity.widgetName, ...overriddenPropertyPathArray],
        clonedValue,
      );
    });
  } else if (
    propertyPath in entity.propertyOverrideDependency &&
    clonedValue === undefined
  ) {
    // when value is undefined and has default value then set value to default value.
    // this is for resetForm
    const propertyOverridingKeyMap =
      entity.propertyOverrideDependency[propertyPath];
    if (propertyOverridingKeyMap.DEFAULT) {
      const defaultValue = entity[propertyOverridingKeyMap.DEFAULT];
      const clonedDefaultValue = clone(defaultValue);
      if (defaultValue !== undefined) {
        const propertyPathArray = propertyPath.split(".");
        _.set(
          currentTree,
          [entity.widgetName, ...propertyPathArray],
          clonedDefaultValue,
        );
        return {
          overwriteParsedValue: true,
          newValue: clonedDefaultValue,
        };
      }
    }
  }
};
