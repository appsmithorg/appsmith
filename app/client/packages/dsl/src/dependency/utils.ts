import get from "lodash/get";
import union from "lodash/union";
import {
  getDynamicBindings,
  type DataTreeEntity,
  type JSActionEntity,
} from "../migrate/utils";
import type { BindingsInfo, OverrideDependency, EvalError } from "./types";
import { EvalErrorTypes, type EvaluationSubstitutionType } from "./enums";
import { extractIdentifierInfoFromCode } from "@shared/ast";
import { isInteger, toPath } from "lodash";
import { RESERVED_KEYWORDS_AND_INDENTIFIERS } from "./constants";

export const addWidgetPropertyDependencies = ({
  propertyOverrideDependency,
  widgetName,
}: {
  propertyOverrideDependency: Record<string, Partial<OverrideDependency>>;
  widgetName: string;
}) => {
  const dependencies: Record<string, string[]> = {};

  Object.entries(propertyOverrideDependency).forEach(
    ([overriddenPropertyKey, overridingPropertyKeyMap]) => {
      const existingDependenciesSet = new Set(
        dependencies[`${widgetName}.${overriddenPropertyKey}`] || [],
      );
      // add meta dependency
      overridingPropertyKeyMap.META &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.META}`,
        );
      // add default dependency
      overridingPropertyKeyMap.DEFAULT &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.DEFAULT}`,
        );

      dependencies[`${widgetName}.${overriddenPropertyKey}`] = [
        ...existingDependenciesSet,
      ];
    },
  );
  return dependencies;
};

export function getDependencyFromEntityPath(
  propertyPath: string,
  entity: DataTreeEntity,
) {
  const unevalPropValue = get(entity, propertyPath, "").toString();
  const { jsSnippets } = getDynamicBindings(unevalPropValue, entity);
  const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

  return validJSSnippets;
}

export function getActionDependencies(
  actionEntity: DataTreeEntity,
  actionConfig: {
    name: string;
    dependencyMap?: Record<string, string[]>;
    dynamicBindingPathList?: {
      key: string;
      value?: string;
    }[];
  },
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const actionName = actionConfig.name;
  const actionDependencyMap = actionConfig.dependencyMap || {};
  const { dynamicBindingPathList = [] } = actionConfig;

  for (const [propertyPath, pathDeps] of Object.entries(actionDependencyMap)) {
    const fullPropertyPath = `${actionName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps
      .map((dependentPath) => `${actionName}.${dependentPath}`)
      .filter((path) => allKeys.hasOwnProperty(path));
    dependencies[fullPropertyPath] = propertyPathDependencies;
  }

  for (const dynamicPath of dynamicBindingPathList) {
    const propertyPath = dynamicPath.key;
    const fullPropertyPath = `${actionName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      actionEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDependencies = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDependencies };
  }

  return dependencies;
}

export function getJSDependencies(
  jsEntity: JSActionEntity,
  jsActionConfig: {
    name: string;
    dependencyMap?: Record<string, string[]>;
    reactivePaths: Record<string, EvaluationSubstitutionType>;
  },
  allKeys: Record<string, true>,
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const jsActionReactivePaths = jsActionConfig.reactivePaths || {};
  const jsActionDependencyMap = jsActionConfig.dependencyMap || {};
  const jsObjectName = jsActionConfig.name || "";

  for (const [propertyPath, pathDeps] of Object.entries(
    jsActionDependencyMap,
  )) {
    const fullPropertyPath = `${jsObjectName}.${propertyPath}`;
    const propertyPathDependencies: string[] = pathDeps
      .map((dependentPath) => `${jsObjectName}.${dependentPath}`)
      .filter((path) => allKeys.hasOwnProperty(path));
    dependencies[fullPropertyPath] = propertyPathDependencies;
  }

  for (const reactivePath of Object.keys(jsActionReactivePaths)) {
    const fullPropertyPath = `${jsObjectName}.${reactivePath}`;
    const reactivePathDependencies = getDependencyFromEntityPath(
      reactivePath,
      jsEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDeps = union(existingDeps, reactivePathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDeps };
  }

  return dependencies;
}

export function getWidgetDependencies(
  widgetEntity: any, // TODO: fix WidgetEntity
  widgetConfig: {
    name: string;
    dependencyMap?: Record<string, string[]>;
    dynamicBindingPathList?: {
      key: string;
      value?: string;
    }[];
    dynamicTriggerPathList?: {
      key: string;
      value?: string;
    }[];
    propertyOverrideDependency: Record<string, Partial<OverrideDependency>>;
  },
): Record<string, string[]> {
  let dependencies: Record<string, string[]> = {};
  const widgetName = widgetEntity.widgetName;
  const {
    dynamicBindingPathList = [],
    dynamicTriggerPathList = [],
    propertyOverrideDependency,
  } = widgetConfig;
  const widgetInternalDependencies = addWidgetPropertyDependencies({
    propertyOverrideDependency,
    widgetName,
  });

  dependencies = { ...widgetInternalDependencies };

  const dependencyMap = widgetConfig.dependencyMap;

  for (const source in dependencyMap) {
    if (!dependencyMap.hasOwnProperty(source)) continue;
    const targetPaths = dependencyMap[source];
    const fullPropertyPath = `${widgetName}.${source}`;
    dependencies[fullPropertyPath] = dependencies[fullPropertyPath] || [];
    dependencies[fullPropertyPath].push(
      ...targetPaths.map((p) => `${widgetName}.${p}`),
    );
  }

  for (const { key } of dynamicTriggerPathList) {
    dependencies[`${widgetName}.${key}`] = [];
  }

  for (const bindingPath of dynamicBindingPathList) {
    const propertyPath = bindingPath.key;
    const fullPropertyPath = `${widgetName}.${propertyPath}`;
    const dynamicPathDependencies = getDependencyFromEntityPath(
      propertyPath,
      widgetEntity,
    );
    const existingDeps = dependencies[fullPropertyPath] || [];
    const newDeps = union(existingDeps, dynamicPathDependencies);
    dependencies = { ...dependencies, [fullPropertyPath]: newDeps };
  }

  return dependencies;
}

export const getEntityDependencies = (
  entity: any, // TODO: fix DataTreeEntity
  entityConfig: any, // TODO: fix DataTreeEntityConfig
  allKeys: Record<string, true>,
) => {
  if (entity.ENTITY_TYPE === "ACTION") {
    return getActionDependencies(entity, entityConfig, allKeys);
  }

  if (entity.ENTITY_TYPE === "JSACTION") {
    return getJSDependencies(entity, entityConfig, allKeys);
  }

  if (entity.ENTITY_TYPE === "WIDGET") {
    return getWidgetDependencies(entity, entityConfig);
  }

  return {};
};

export const getSetterFunctions = (configTree: {
  [entityName: string]: {
    __setters?: Record<
      string,
      {
        path: string;
        type: string;
      }
    >;
  };
}) => {
  const entityNames = Object.keys(configTree);

  const setters = entityNames.reduce((acc, entityName) => {
    const entityConfig = configTree[entityName];
    const entityMethodMap: Record<string, true> = {};

    if (!entityConfig) return acc;

    if (entityConfig.__setters) {
      for (const setterMethodName of Object.keys(entityConfig.__setters)) {
        entityMethodMap[`${entityName}.${setterMethodName}`] = true;
      }
    }

    return { ...acc, ...entityMethodMap };
  }, {});

  return setters;
};

export const extractInfoFromBindings = (
  bindings: string[],
  allKeys: Record<string, true>,
  evaluationVersion: number = 2,
  reservedLibraryIdentifiers: Record<string, boolean> = {},
) => {
  return bindings.reduce(
    (bindingsInfo: BindingsInfo, binding) => {
      try {
        const references = extractInfoFromBinding(
          binding,
          allKeys,
          evaluationVersion,
          reservedLibraryIdentifiers,
        );
        return {
          ...bindingsInfo,
          references: union(bindingsInfo.references, references),
        };
      } catch (error) {
        const newEvalError: EvalError = {
          type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
          message: (error as Error).message,
          context: {
            script: binding,
          },
        };
        return {
          ...bindingsInfo,
          errors: union(bindingsInfo.errors, [newEvalError]),
        };
      }
    },
    { references: [], errors: [] },
  );
};

/** This function extracts validReferences and invalidReferences from a binding {{}}
 * @param script
 * @param allPaths
 * @returns validReferences - Valid references from bindings
 * invalidReferences- References which are currently invalid
 * @example - For binding {{unknownEntity.name + Api1.name}}, it returns
 * {
 * validReferences:[Api1.name],
 * invalidReferences: [unknownEntity.name]
 * }
 */
const extractInfoFromBinding = (
  script: string,
  allKeys: Record<string, true>,
  evaluationVersion: number = 2,
  reservedLibraryIdentifiers: Record<string, boolean> = {},
) => {
  const { references } = extractIdentifierInfoFromCode(
    script,
    evaluationVersion,
    { ...RESERVED_KEYWORDS_AND_INDENTIFIERS, ...reservedLibraryIdentifiers },
  );
  return getPrunedReferences(references, allKeys);
};

const getPrunedReferences = (
  references: string[],
  allKeys: Record<string, true>,
) => {
  const prunedReferences: Set<string> = new Set<string>();

  references.forEach((reference: string) => {
    // If the identifier exists directly, add it and return
    if (allKeys.hasOwnProperty(reference)) {
      prunedReferences.add(reference);
      return;
    }
    const subpaths = toPath(reference);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement, and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (allKeys.hasOwnProperty(current)) {
        prunedReferences.add(current);
        return;
      }
      subpaths.pop();
    }
    // If no valid reference is derived, add reference as is
    prunedReferences.add(reference);
  });
  return Array.from(prunedReferences);
};

export const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach((segment) => {
    if (isInteger(segment)) {
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
