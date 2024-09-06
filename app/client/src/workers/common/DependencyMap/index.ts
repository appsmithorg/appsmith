import type { DataTreeDiff } from "ee/workers/Evaluation/evaluationUtils";
import {
  getAllPaths,
  DataTreeDiffEvent,
  getEntityNameAndPropertyPath,
  isDynamicLeaf,
} from "ee/workers/Evaluation/evaluationUtils";
import type {
  WidgetEntity,
  ActionEntity,
  JSActionEntity,
  DataTreeEntityObject,
} from "ee/entities/DataTree/types";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import { getEntityId, getEvalErrorPath } from "utils/DynamicBindingUtils";
import { convertArrayToObject, extractInfoFromBindings } from "./utils";
import type DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import { get, isEmpty, set } from "lodash";
import { getFixedTimeDifference } from "../DataTreeEvaluator/utils";
import {
  getEntityDependencies,
  getEntityPathDependencies,
} from "./utils/getEntityDependencies";
import { DependencyMapUtils } from "entities/DependencyMap/DependencyMapUtils";
import { AppsmithFunctionsWithFields } from "components/editorComponents/ActionCreator/constants";
import {
  getAllSetterFunctions,
  getEntitySetterFunctions,
} from "ee/workers/Evaluation/Actions";
import { isWidgetActionOrJsObject } from "ee/entities/DataTree/utils";
import { getValidEntityType } from "workers/common/DataTreeEvaluator/utils";
import type DependencyMap from "entities/DependencyMap";

export function createDependencyMap(
  dataTreeEvalRef: DataTreeEvaluator,
  unEvalTree: DataTree,
  configTree: ConfigTree,
) {
  const { allKeys, dependencyMap } = dataTreeEvalRef;
  const allAppsmithInternalFunctions = convertArrayToObject(
    AppsmithFunctionsWithFields,
  );
  const setterFunctions = getAllSetterFunctions(unEvalTree, configTree);
  dependencyMap.addNodes(
    { ...allKeys, ...allAppsmithInternalFunctions, ...setterFunctions },
    false,
  );

  Object.keys(configTree).forEach((entityName) => {
    const entity = unEvalTree[entityName];
    const entityConfig = configTree[entityName];
    const entityDependencies = getEntityDependencies(
      entity as DataTreeEntityObject,
      entityConfig,
      allKeys,
    );

    for (const path of Object.keys(entityDependencies)) {
      const pathDependencies = entityDependencies[path];
      const { errors, references } = extractInfoFromBindings(
        pathDependencies,
        allKeys,
      );
      dependencyMap.addDependency(path, references);
      dataTreeEvalRef.errors.push(...errors);
    }
  });

  DependencyMapUtils.makeParentsDependOnChildren(dependencyMap);

  return {
    dependencies: dependencyMap.dependencies,
    inverseDependencies: dependencyMap.inverseDependencies,
  };
}
const addingAffectedNodesToList = (
  affectedNodes: Set<string>,
  addedNodes: string[],
) => {
  addedNodes.forEach((v) => affectedNodes.add(v));
};

const addNodesToDependencyMap =
  (affectedNodes: Set<string>, dependencyMap: DependencyMap) =>
  (addedNodes: Record<string, true>, strict?: boolean) => {
    const didUpdateDep = dependencyMap.addNodes(addedNodes, strict);
    if (didUpdateDep) {
      addingAffectedNodesToList(affectedNodes, Object.keys(addedNodes));
    }
    return didUpdateDep;
  };

const setDependenciesToDependencyMap =
  (affectedNodes: Set<string>, dependencyMap: DependencyMap) =>
  (node: string, dependencies: string[]) => {
    dependencyMap.addDependency(node, dependencies);

    addingAffectedNodesToList(affectedNodes, [node, ...dependencies]);
  };

export const updateDependencyMap = ({
  configTree,
  dataTreeEvalRef,
  translatedDiffs,
  unEvalDataTree,
}: {
  dataTreeEvalRef: DataTreeEvaluator;
  translatedDiffs: Array<DataTreeDiff>;
  unEvalDataTree: DataTree;
  configTree: ConfigTree;
}) => {
  const diffCalcStart = performance.now();
  const dependenciesOfRemovedPaths: Array<string> = [];
  const removedPaths: Array<{ entityId: string; fullpath: string }> = [];
  let didUpdateDependencyMap = false;
  const { allKeys, dependencyMap, oldConfigTree, oldUnEvalTree } =
    dataTreeEvalRef;
  let { errors: dataTreeEvalErrors } = dataTreeEvalRef;
  const affectedNodes: Set<string> = new Set();
  const addNodesToDepedencyMapFn = addNodesToDependencyMap(
    affectedNodes,
    dependencyMap,
  );
  const setDependenciesToDepedencyMapFn = setDependenciesToDependencyMap(
    affectedNodes,
    dependencyMap,
  );
  translatedDiffs.forEach((dataTreeDiff) => {
    const {
      event,
      payload: { propertyPath: fullPropertyPath, value },
    } = dataTreeDiff;
    const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);
    const entityConfig =
      event === DataTreeDiffEvent.DELETE
        ? oldConfigTree[entityName]
        : configTree[entityName];

    const entity =
      event === DataTreeDiffEvent.DELETE
        ? oldUnEvalTree[entityName]
        : unEvalDataTree[entityName];
    const entityType = getValidEntityType(entity, entityConfig);

    if (entityType !== "noop") {
      switch (event) {
        case DataTreeDiffEvent.NEW: {
          const allAddedPaths = getAllPaths({
            [fullPropertyPath]: get(unEvalDataTree, fullPropertyPath),
          });
          // If a new entity is added, add setter functions to all nodes
          if (entityName === fullPropertyPath) {
            const addedNodes = getEntitySetterFunctions(
              entityConfig,
              entityName,
              entity,
            );
            didUpdateDependencyMap =
              addNodesToDepedencyMapFn(addedNodes) || didUpdateDependencyMap;
          }

          didUpdateDependencyMap =
            addNodesToDepedencyMapFn(allAddedPaths, false) ||
            didUpdateDependencyMap;

          if (isWidgetActionOrJsObject(entity)) {
            if (!isDynamicLeaf(unEvalDataTree, fullPropertyPath, configTree)) {
              const entityDependencyMap = getEntityDependencies(
                entity,
                configTree[entityName],
                allKeys,
              );
              if (!isEmpty(entityDependencyMap)) {
                // The entity might already have some dependencies,
                // so we just want to update those
                Object.entries(entityDependencyMap).forEach(
                  ([path, pathDependencies]) => {
                    const { errors: extractDependencyErrors, references } =
                      extractInfoFromBindings(pathDependencies, allKeys);

                    setDependenciesToDepedencyMapFn(path, references);

                    didUpdateDependencyMap = true;
                    dataTreeEvalErrors = dataTreeEvalErrors.concat(
                      extractDependencyErrors,
                    );
                  },
                );
              }
            } else {
              const entityPathDependencies = getEntityPathDependencies(
                entity,
                entityConfig,
                fullPropertyPath,
                allKeys,
              );
              const { errors: extractDependencyErrors, references } =
                extractInfoFromBindings(entityPathDependencies, allKeys);

              setDependenciesToDepedencyMapFn(fullPropertyPath, references);

              didUpdateDependencyMap = true;
              dataTreeEvalErrors = dataTreeEvalErrors.concat(
                extractDependencyErrors,
              );
            }
          }
          break;
        }
        case DataTreeDiffEvent.DELETE: {
          const allDeletedPaths = getAllPaths({
            [fullPropertyPath]: get(oldUnEvalTree, fullPropertyPath),
          });
          // If an entity is deleted, remove all setter functions
          if (entityName === fullPropertyPath) {
            const didUpdateDep = dependencyMap.removeNodes(
              getEntitySetterFunctions(entityConfig, entityName, entity),
            );
            if (didUpdateDep) didUpdateDependencyMap = true;
          }

          for (const deletedPath of Object.keys(allDeletedPaths)) {
            const pathsThatDependOnDeletedPath =
              dependencyMap.getDependents(deletedPath);
            dependenciesOfRemovedPaths.push(...pathsThatDependOnDeletedPath);
          }

          const didUpdateDeps = dependencyMap.removeNodes(allDeletedPaths);

          if (didUpdateDeps) didUpdateDependencyMap = true;

          if (isWidgetActionOrJsObject(entity)) {
            const entityId = getEntityId(entity);
            for (const deletedPath of Object.keys(allDeletedPaths)) {
              removedPaths.push({
                entityId: entityId || "",
                fullpath: deletedPath,
              });
            }
          }
          break;
        }
        case DataTreeDiffEvent.EDIT: {
          if (isWidgetActionOrJsObject(entity) && typeof value === "string") {
            const entity: ActionEntity | WidgetEntity | JSActionEntity =
              unEvalDataTree[entityName] as
                | ActionEntity
                | WidgetEntity
                | JSActionEntity;
            const entityConfig = configTree[entityName];
            const fullPropertyPath = dataTreeDiff.payload.propertyPath;

            const entityPathDependencies = getEntityPathDependencies(
              entity,
              entityConfig,
              fullPropertyPath,
              allKeys,
            );
            const { errors: extractDependencyErrors, references } =
              extractInfoFromBindings(entityPathDependencies, allKeys);
            setDependenciesToDepedencyMapFn(fullPropertyPath, references);

            didUpdateDependencyMap = true;
            dataTreeEvalErrors = dataTreeEvalErrors.concat(
              extractDependencyErrors,
            );
          }
          break;
        }
        default: {
          break;
        }
      }
    }
  });

  const diffCalcEnd = performance.now();
  const updateChangedDependenciesStart = performance.now();

  if (didUpdateDependencyMap) {
    DependencyMapUtils.linkChildToItsParentNodeForAffectedChildNodes(
      dependencyMap,
      affectedNodes,
    );
    dataTreeEvalRef.sortedDependencies = dataTreeEvalRef.sortDependencies(
      dependencyMap,
      translatedDiffs,
    );
  }

  /** We need this in order clear out the paths that could have errors when a property is deleted */
  if (removedPaths.length) {
    removedPaths.forEach(({ fullpath }) => {
      set(dataTreeEvalRef.evalProps, getEvalErrorPath(fullpath), []);
    });
  }

  const updateChangedDependenciesStop = performance.now();
  dataTreeEvalRef.logs.push({
    diffCalcDeps: (diffCalcEnd - diffCalcStart).toFixed(2),
    updateChangedDependencies: getFixedTimeDifference(
      updateChangedDependenciesStop,
      updateChangedDependenciesStart,
    ),
  });

  return {
    dependenciesOfRemovedPaths,
    removedPaths,
    dependencies: dependencyMap.dependencies,
    inverseDependencies: dependencyMap.inverseDependencies,
  };
};
