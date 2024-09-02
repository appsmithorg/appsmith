import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { get, set } from "lodash";
import { isJSObject, isWidget } from "ee/workers/Evaluation/evaluationUtils";
import type { DependencyMap } from "./DynamicBindingUtils";
import WidgetFactory from "../WidgetProvider/factory";

type GroupedDependencyMap = Record<string, DependencyMap>;

// group dependants by entity and filter self-dependencies
// because, we're only interested in entities that depend on other entitites
// filter exception: JS_OBJECT's, when a function depends on another function within the same object
export const groupAndFilterDependantsMap = (
  inverseMap: DependencyMap,
  dataTree: DataTree,
): GroupedDependencyMap => {
  const entitiesDepMap: GroupedDependencyMap = {};

  Object.entries(inverseMap).forEach(([fullDependencyPath, dependants]) => {
    const dependencyEntityName = fullDependencyPath.split(".")[0];
    const dataTreeEntity = dataTree[dependencyEntityName];
    if (!dataTreeEntity) return;
    const isJS_Object = isJSObject(dataTreeEntity);

    const entityDependantsMap = entitiesDepMap[dependencyEntityName] || {};
    let entityPathDependants = entityDependantsMap[fullDependencyPath] || [];

    entityPathDependants = entityPathDependants.concat(
      isJS_Object
        ? /* include self-dependent properties for JsObjects
              e.g. {
                "JsObject.internalFunc": [ "JsObject.fun1", "JsObject" ]
              }
              When fun1 calls internalfunc within it's body.
              Will keep "JsObject.fun1" and filter "JsObject".
          */
          dependants.filter((dep) => dep !== dependencyEntityName)
        : /* filter self-dependent properties for everything else
              e.g. {
                Select1.selectedOptionValue: [
                  'Select1.isValid', 'Select1'
                ]
              }
              Will remove both 'Select1.isValid', 'Select1'.
          */
          dependants.filter(
            (dep) => dep.split(".")[0] !== dependencyEntityName,
          ),
    );

    if (!(entityPathDependants.length > 0)) return;
    set(
      entitiesDepMap,
      [dependencyEntityName, fullDependencyPath],
      entityPathDependants,
    );
  });

  return entitiesDepMap;
};

// get entity paths that depend on a given list of entites
// e.g. widget paths that depend on a list of actions
export const getEntityDependantPaths = (
  fullEntityPaths: string[],
  allEntitiesDependantsmap: GroupedDependencyMap,
  visitedPaths: Set<string>,
): Set<string> => {
  const dependantEntityNames = new Set<string>();
  const dependantEntityFullPaths = new Set<string>();

  fullEntityPaths.forEach((fullEntityPath) => {
    const entityPathArray = fullEntityPath.split(".");
    const entityName = entityPathArray[0];
    if (!(entityName in allEntitiesDependantsmap)) return;
    const entityDependantsMap = allEntitiesDependantsmap[entityName];

    // goes through properties of an entity
    Object.entries(entityDependantsMap).forEach(
      ([fullDependencyPath, dependants]) => {
        // skip other properties, when searching for a specific entityPath
        // e.g. Entity.prop1 should not go through dependants of Entity.prop2
        if (
          entityPathArray.length > 1 &&
          fullDependencyPath !== fullEntityPath
        ) {
          return;
        }

        // goes through dependants of a property
        dependants.forEach((dependantPath) => {
          const dependantEntityName = dependantPath.split(".")[0];
          // Marking visited paths to avoid infinite recursion.
          if (visitedPaths.has(dependantPath)) {
            return;
          }
          visitedPaths.add(dependantPath);

          dependantEntityNames.add(dependantEntityName);
          dependantEntityFullPaths.add(dependantPath);

          const childDependants = getEntityDependantPaths(
            [dependantPath],
            allEntitiesDependantsmap,
            visitedPaths,
          );

          childDependants.forEach((childDependantPath) => {
            dependantEntityFullPaths.add(childDependantPath);
          });
        });
      },
    );
  });

  return dependantEntityFullPaths;
};

export const findLoadingEntities = (
  loadingActions: string[],
  dataTree: DataTree,
  inverseMap: DependencyMap,
): Set<string> => {
  const entitiesDependantsMap = groupAndFilterDependantsMap(
    inverseMap,
    dataTree,
  );
  const loadingEntityPaths = getEntityDependantPaths(
    loadingActions,
    entitiesDependantsMap,
    new Set<string>(),
  );

  // check animateLoading is active on current widgets and set
  const filteredLoadingEntityNames = new Set<string>();

  loadingEntityPaths.forEach((entityPath) => {
    const entityPathArray = entityPath.split(".");
    const entityName = entityPathArray[0];
    const widget = get(dataTree, [entityName]);
    if (isWidget(widget)) {
      const loadingProperties = WidgetFactory.getLoadingProperties(widget.type);

      // check if propertyPath is listed in widgetConfig
      if (
        entityPathArray.length > 1 &&
        loadingProperties &&
        !loadingProperties.some((propRegExp) => propRegExp.test(entityPath))
      ) {
        return;
      }
    }

    // check animateLoading is active on current widgets and set
    get(dataTree, [entityName, "animateLoading"]) === true &&
      filteredLoadingEntityNames.add(entityName);
  });

  return filteredLoadingEntityNames;
};
