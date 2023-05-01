import type {
  DataTreeEvaluationProps,
  DependencyMap,
  EvalError,
  EvaluationError,
} from "utils/DynamicBindingUtils";
import {
  EvalErrorTypes,
  getDynamicBindings,
  getEntityDynamicBindingPathList,
  getEntityId,
  getEntityName,
  getEntityType,
  getEvalErrorPath,
  getEvalValuePath,
  isChildPropertyPath,
  isDynamicValue,
  isPathADynamicBinding,
  isPathDynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import type { WidgetTypeConfigMap } from "utils/WidgetFactory";
import type {
  DataTree,
  DataTreeEntity,
  WidgetEntity,
  ConfigTree,
  WidgetEntityConfig,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type {
  ActionEntity,
  JSActionEntity,
  JSActionEntityConfig,
} from "entities/DataTree/types";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { PrivateWidgets } from "entities/DataTree/types";
import { ENTITY_TYPE } from "entities/DataTree/types";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";

import {
  addDependantsOfNestedPropertyPaths,
  addErrorToEntityProperty,
  convertPathToString,
  CrashingError,
  getEntityNameAndPropertyPath,
  getImmediateParentsOfPropertyPaths,
  isAction,
  isDynamicLeaf,
  isJSAction,
  isWidget,
  translateDiffEventToDataTreeDiffEvent,
  trimDependantChangePaths,
  overrideWidgetProperties,
  getAllPaths,
  isValidEntity,
  isNewEntity,
  getStaleMetaStateIds,
  convertJSFunctionsToString,
  DataTreeDiffEvent,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  difference,
  flatten,
  get,
  isArray,
  isEmpty,
  isEqual,
  isFunction,
  isObject,
  set,
  union,
  unset,
} from "lodash";

import type { Diff } from "deep-diff";
import { applyChange, diff } from "deep-diff";
import toposort from "toposort";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
  THIS_DOT_PARAMS_KEY,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { EvalResult, EvaluateContext } from "workers/Evaluation/evaluate";
import evaluateSync, { evaluateAsync } from "workers/Evaluation/evaluate";
import { substituteDynamicBindingWithValues } from "workers/Evaluation/evaluationSubstitution";
import { Severity } from "entities/AppsmithConsole";
import { error as logError } from "loglevel";
import type { JSUpdate } from "utils/JSPaneUtils";

import type {
  ActionValidationConfigMap,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { klona } from "klona/full";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import {
  updateDependencyMap,
  createDependencyMap,
} from "workers/common/DependencyMap";
import {
  getJSEntities,
  getUpdatedLocalUnEvalTreeAfterJSUpdates,
  parseJSActions,
  updateEvalTreeWithJSCollectionState,
} from "workers/Evaluation/JSObject";
import {
  addRootcauseToAsyncInvocationErrors,
  getFixedTimeDifference,
} from "./utils";
import { isJSObjectFunction } from "workers/Evaluation/JSObject/utils";
import {
  getValidatedTree,
  validateActionProperty,
  validateAndParseWidgetProperty,
} from "./validationUtils";
import { errorModifier } from "workers/Evaluation/errorModifier";
import JSObjectCollection from "workers/Evaluation/JSObject/Collection";
import userLogs from "workers/Evaluation/fns/overrides/console";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";

type SortedDependencies = Array<string>;
export type EvalProps = {
  [entityName: string]: DataTreeEvaluationProps;
};

export default class DataTreeEvaluator {
  /**
   * dependencyMap: Maintains map of <PATH, list of paths that re-evaluates on the evaluation of the PATH>
   */
  dependencyMap: DependencyMap = {};
  sortedDependencies: SortedDependencies = [];
  inverseDependencyMap: DependencyMap = {};
  widgetConfigMap: WidgetTypeConfigMap = {};
  evalTree: DataTree = {};

  /**
   * This contains raw evaluated value without any validation or parsing.
   * This is used for revalidation as we do not store the raw validated value.
   */
  unParsedEvalTree: DataTree = {};
  allKeys: Record<string, true> = {};
  privateWidgets: PrivateWidgets = {};
  oldUnEvalTree: DataTree = {};
  oldConfigTree: ConfigTree = {};
  errors: EvalError[] = [];
  logs: unknown[] = [];
  console = userLogs;
  allActionValidationConfig?: {
    [actionId: string]: ActionValidationConfigMap;
  };
  triggerFieldDependencyMap: DependencyMap = {};
  /**  Keeps track of all invalid references in bindings throughout the Application
   * Eg. For binding {{unknownEntity.name + Api1.name}} in Button1.text, where Api1 is present in dataTree but unknownEntity is not,
   * the map has a key-value pair of
   * {
   *  "Button1.text": [unknownEntity.name]
   * }
   */
  invalidReferencesMap: DependencyMap = {};
  /**
   * Maintains dependency of paths to re-validate on evaluation of particular property path.
   */
  validationDependencyMap: DependencyMap = {};
  sortedValidationDependencies: SortedDependencies = [];
  inverseValidationDependencyMap: DependencyMap = {};

  /**
   * Sanitized eval values and errors
   */
  evalProps: EvalProps = {};
  public hasCyclicalDependency = false;
  constructor(
    widgetConfigMap: WidgetTypeConfigMap,
    allActionValidationConfig?: {
      [actionId: string]: ActionValidationConfigMap;
    },
  ) {
    this.allActionValidationConfig = allActionValidationConfig;
    this.widgetConfigMap = widgetConfigMap;
  }

  getEvalTree() {
    return this.evalTree;
  }

  setEvalTree(evalTree: DataTree) {
    this.evalTree = evalTree;
  }

  getUnParsedEvalTree() {
    return this.unParsedEvalTree;
  }

  setUnParsedEvalTree(unParsedEvalTree: DataTree) {
    this.unParsedEvalTree = unParsedEvalTree;
  }

  getOldUnevalTree() {
    return this.oldUnEvalTree;
  }

  /**
   * Method to create all data required for linting and
   * evaluation of the first tree
   */
  setupFirstTree(
    unEvalTree: any,
    configTree: ConfigTree,
  ): {
    jsUpdates: Record<string, JSUpdate>;
    evalOrder: string[];
    lintOrder: string[];
  } {
    const totalFirstTreeSetupStartTime = performance.now();
    // cloneDeep will make sure not to omit key which has value as undefined.
    const firstCloneStartTime = performance.now();
    let localUnEvalTree = klona(unEvalTree);
    const firstCloneEndTime = performance.now();

    let jsUpdates: Record<string, JSUpdate> = {};
    //parse js collection to get functions
    //save current state of js collection action and variables to be added to uneval tree
    //save functions in resolveFunctions (as functions) to be executed as functions are not allowed in evalTree
    //and functions are saved in dataTree as strings

    const parsedCollections = parseJSActions(this, localUnEvalTree);
    jsUpdates = parsedCollections.jsUpdates;
    localUnEvalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      configTree,
    );
    const allKeysGenerationStartTime = performance.now();
    // set All keys
    this.allKeys = getAllPaths(localUnEvalTree);
    const allKeysGenerationEndTime = performance.now();

    const createDependencyMapStartTime = performance.now();
    // Create dependency map
    const {
      dependencyMap,
      invalidReferencesMap,
      triggerFieldDependencyMap,
      validationDependencyMap,
    } = createDependencyMap(this, localUnEvalTree, configTree);
    const createDependencyMapEndTime = performance.now();

    this.dependencyMap = dependencyMap;
    this.triggerFieldDependencyMap = triggerFieldDependencyMap;
    this.invalidReferencesMap = invalidReferencesMap;
    this.validationDependencyMap = validationDependencyMap;
    const sortDependenciesStartTime = performance.now();
    // Sort
    this.sortedDependencies = this.sortDependencies(this.dependencyMap);
    this.sortedValidationDependencies = this.sortDependencies(
      validationDependencyMap,
    );
    const sortDependenciesEndTime = performance.now();

    const inverseDependencyGenerationStartTime = performance.now();
    // Inverse
    this.inverseDependencyMap = this.getInverseDependencyTree({
      dependencyMap,
      sortedDependencies: this.sortedDependencies,
    });
    this.inverseValidationDependencyMap = this.getInverseDependencyTree({
      dependencyMap: validationDependencyMap,
      sortedDependencies: this.sortedValidationDependencies,
    });
    const inverseDependencyGenerationEndTime = performance.now();

    const secondCloneStartTime = performance.now();
    this.oldUnEvalTree = klona(localUnEvalTree);
    this.oldConfigTree = configTree;
    const secondCloneEndTime = performance.now();

    const totalFirstTreeSetupEndTime = performance.now();

    const timeTakenForSetupFirstTree = {
      total: getFixedTimeDifference(
        totalFirstTreeSetupEndTime,
        totalFirstTreeSetupStartTime,
      ),
      clone: getFixedTimeDifference(
        firstCloneEndTime + secondCloneEndTime,
        firstCloneStartTime + secondCloneStartTime,
      ),
      allKeys: getFixedTimeDifference(
        allKeysGenerationEndTime,
        allKeysGenerationStartTime,
      ),
      createDependencyMap: getFixedTimeDifference(
        createDependencyMapEndTime,
        createDependencyMapStartTime,
      ),
      sortDependencies: getFixedTimeDifference(
        sortDependenciesEndTime,
        sortDependenciesStartTime,
      ),
      inverseDependency: getFixedTimeDifference(
        inverseDependencyGenerationEndTime,
        inverseDependencyGenerationStartTime,
      ),
    };
    this.logs.push({ timeTakenForSetupFirstTree });
    return {
      jsUpdates,
      evalOrder: this.sortedDependencies,
      lintOrder: this.sortedDependencies,
    };
  }

  evalAndValidateFirstTree(): {
    evalTree: DataTree;
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
  } {
    const evaluationStartTime = performance.now();
    // Evaluate
    const { evalMetaUpdates, evaluatedTree, staleMetaIds } = this.evaluateTree(
      this.oldUnEvalTree,
      this.sortedDependencies,
      undefined,
      this.oldConfigTree,
    );
    const evaluationEndTime = performance.now();
    const validationStartTime = performance.now();
    // Validate Widgets
    this.setEvalTree(
      getValidatedTree(
        evaluatedTree,
        {
          evalProps: this.evalProps,
        },
        this.oldConfigTree,
      ),
    );

    const validationEndTime = performance.now();

    const timeTakenForEvalAndValidateFirstTree = {
      evaluation: getFixedTimeDifference(
        evaluationEndTime,
        evaluationStartTime,
      ),
      validation: getFixedTimeDifference(
        validationEndTime,
        validationStartTime,
      ),
    };
    this.logs.push({ timeTakenForEvalAndValidateFirstTree });

    return {
      evalTree: this.getEvalTree(),
      evalMetaUpdates,
      staleMetaIds,
    };
  }

  updateLocalUnEvalTree(unevalTree: DataTree, configTree: ConfigTree) {
    //add functions and variables to unevalTree
    const unEvalJSCollection = JSObjectCollection.getUnEvalState();
    Object.keys(unEvalJSCollection).forEach((update) => {
      const updates = unEvalJSCollection[update];
      if (!!unevalTree[update]) {
        Object.keys(updates).forEach((key) => {
          const data = get(unevalTree, `${update}.${key}.data`, undefined);
          if (isJSObjectFunction(unevalTree, update, key, configTree)) {
            set(unevalTree, `${update}.${key}`, new String(updates[key]));
            set(unevalTree, `${update}.${key}.data`, data);
          } else {
            set(unevalTree, `${update}.${key}`, updates[key]);
          }
        });
      }
    });
  }

  /**
   * Method to create all data required for linting and
   * evaluation of the updated tree
   */

  setupUpdateTree(
    unEvalTree: any,
    configTree: ConfigTree,
  ): {
    unEvalUpdates: DataTreeDiff[];
    evalOrder: string[];
    lintOrder: string[];
    jsUpdates: Record<string, JSUpdate>;
    nonDynamicFieldValidationOrder: string[];
    pathsToClearErrorsFor: any[];
    isNewWidgetAdded: boolean;
  } {
    const totalUpdateTreeSetupStartTime = performance.now();

    let localUnEvalTree = Object.assign({}, unEvalTree);
    let jsUpdates: Record<string, JSUpdate> = {};
    const diffCheckTimeStartTime = performance.now();
    //update uneval tree from previously saved current state of collection
    this.updateLocalUnEvalTree(localUnEvalTree, configTree);
    //get difference in js collection body to be parsed
    const oldUnEvalTreeJSCollections = getJSEntities(this.oldUnEvalTree);
    const localUnEvalTreeJSCollection = getJSEntities(localUnEvalTree);

    const jsDifferences: Diff<
      Record<string, JSActionEntity>,
      Record<string, JSActionEntity>
    >[] = diff(oldUnEvalTreeJSCollections, localUnEvalTreeJSCollection) || [];
    const jsTranslatedDiffs = flatten(
      jsDifferences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, localUnEvalTree),
      ),
    );
    //save parsed functions in resolveJSFunctions, update current state of js collection
    const parsedCollections = parseJSActions(
      this,
      localUnEvalTree,
      this.oldUnEvalTree,
      jsTranslatedDiffs,
    );

    jsUpdates = parsedCollections.jsUpdates;
    //update local data tree if js body has updated (remove/update/add js functions or variables)
    localUnEvalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      configTree,
    );

    const stringifiedOldUnEvalTreeJSCollections = convertJSFunctionsToString(
      oldUnEvalTreeJSCollections,
      this.oldConfigTree,
    );
    const stringifiedLocalUnEvalTreeJSCollection = convertJSFunctionsToString(
      localUnEvalTreeJSCollection,
      configTree,
    );

    const oldUnEvalTreeWithStrigifiedJSFunctions = Object.assign(
      {},
      this.oldUnEvalTree,
      stringifiedOldUnEvalTreeJSCollections,
    );

    const localUnEvalTreeWithStrigifiedJSFunctions = Object.assign(
      {},
      localUnEvalTree,
      stringifiedLocalUnEvalTreeJSCollection,
    );

    const differences: Diff<DataTree, DataTree>[] =
      diff(
        oldUnEvalTreeWithStrigifiedJSFunctions,
        localUnEvalTreeWithStrigifiedJSFunctions,
      ) || [];
    // Since eval tree is listening to possible events that don't cause differences
    // We want to check if no diffs are present and bail out early
    if (differences.length === 0) {
      return {
        pathsToClearErrorsFor: [],
        unEvalUpdates: [],
        evalOrder: [],
        lintOrder: [],
        jsUpdates: {},
        nonDynamicFieldValidationOrder: [],
        isNewWidgetAdded: false,
      };
    }
    let isNewWidgetAdded = false;

    //find all differences which can lead to updating of dependency map
    const translatedDiffs = flatten(
      differences.map((diff) =>
        translateDiffEventToDataTreeDiffEvent(diff, localUnEvalTree),
      ),
    );

    /** We need to know if a new widget was added so that we do not fire ENTITY_BINDING_SUCCESS event */
    for (let i = 0; i < translatedDiffs.length; i++) {
      const diffEvent = translatedDiffs[i];
      if (diffEvent.event === DataTreeDiffEvent.NEW) {
        const entity = localUnEvalTree[diffEvent.payload.propertyPath];

        if (isWidget(entity)) {
          isNewWidgetAdded = true;

          break;
        }
      }
    }

    const diffCheckTimeStopTime = performance.now();
    this.logs.push({
      differences,
      translatedDiffs,
    });
    const updateDependencyStartTime = performance.now();
    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependenciesOfRemovedPaths,
      extraPathsToLint,
      pathsToClearErrorsFor,
      removedPaths,
    } = updateDependencyMap({
      configTree,
      dataTreeEvalRef: this,
      translatedDiffs,
      unEvalDataTree: localUnEvalTree,
    });
    const updateDependencyEndTime = performance.now();

    this.updateEvalTreeWithChanges({ differences });

    const findDifferenceTime = getFixedTimeDifference(
      diffCheckTimeStopTime,
      diffCheckTimeStartTime,
    );

    const updateDependencyMapTime = getFixedTimeDifference(
      updateDependencyEndTime,
      updateDependencyStartTime,
    );

    const pathsChangedSet = new Set<string[]>();
    for (const diff of differences) {
      if (isArray(diff.path)) {
        pathsChangedSet.add(diff.path);
      }
    }

    const updatedValuePaths = [...pathsChangedSet];

    return {
      ...this.setupTree(localUnEvalTree, updatedValuePaths, {
        totalUpdateTreeSetupStartTime,
        dependenciesOfRemovedPaths,
        removedPaths,
        extraPathsToLint,
        translatedDiffs,
        pathsToClearErrorsFor,
        findDifferenceTime,
        updateDependencyMapTime,
        configTree,
        isNewWidgetAdded,
      }),
      jsUpdates,
    };
  }

  getEvaluationOrder({
    configTree,
    localUnEvalTree,
    pathsToSkipFromEval,
    subTreeSortOrder,
  }: {
    localUnEvalTree: DataTree;
    pathsToSkipFromEval: string[];
    subTreeSortOrder: string[];
    configTree: ConfigTree;
  }) {
    // Remove anything from the sort order that is not a dynamic leaf since only those need evaluation
    const evaluationOrder: string[] = [];
    let nonDynamicFieldValidationOrderSet = new Set<string>();

    for (const fullPath of subTreeSortOrder) {
      if (pathsToSkipFromEval.includes(fullPath)) continue;

      if (!isDynamicLeaf(localUnEvalTree, fullPath, configTree)) {
        /**
         * Store fullPath in nonDynamicFieldValidationOrderSet,
         * if the non dynamic value changes to trigger revalidation.
         */
        if (this.inverseValidationDependencyMap[fullPath]) {
          nonDynamicFieldValidationOrderSet = new Set([
            ...nonDynamicFieldValidationOrderSet,
            fullPath,
          ]);
        }
        continue;
      }

      const unEvalPropValue = get(localUnEvalTree, fullPath);
      const evalPropValue = get(this.evalTree, fullPath);
      evaluationOrder.push(fullPath);
      if (isFunction(evalPropValue)) continue;
      // Set all values from unEvalTree to the evalTree to run evaluation for unevaluated values.
      set(this.evalTree, fullPath, unEvalPropValue);
    }

    return { evaluationOrder, nonDynamicFieldValidationOrderSet };
  }

  setupTree(
    localUnEvalTree: DataTree,
    updatedValuePaths: string[][],
    extraParams: {
      totalUpdateTreeSetupStartTime?: any;
      dependenciesOfRemovedPaths?: string[];
      removedPaths?: string[];
      extraPathsToLint?: string[];
      translatedDiffs?: DataTreeDiff[];
      pathsToClearErrorsFor?: any[];
      pathsToSkipFromEval?: string[];
      findDifferenceTime?: string;
      updateDependencyMapTime?: string;
      configTree: ConfigTree;
      isNewWidgetAdded: boolean;
    },
  ) {
    const {
      dependenciesOfRemovedPaths = [],
      extraPathsToLint = [],
      removedPaths = [],
      totalUpdateTreeSetupStartTime = performance.now(),
      translatedDiffs = [],
      pathsToClearErrorsFor = [],
      pathsToSkipFromEval = [],
      findDifferenceTime = "0",
      updateDependencyMapTime = "0",
      configTree,
      isNewWidgetAdded,
    } = extraParams;

    updateEvalTreeWithJSCollectionState(this.evalTree, this.oldUnEvalTree);

    const calculateSortOrderStartTime = performance.now();
    const subTreeSortOrder: string[] = this.calculateSubTreeSortOrder(
      updatedValuePaths,
      dependenciesOfRemovedPaths,
      removedPaths,
      localUnEvalTree,
      configTree,
    );
    const calculateSortOrderEndTime = performance.now();

    const { evaluationOrder, nonDynamicFieldValidationOrderSet } =
      this.getEvaluationOrder({
        localUnEvalTree,
        pathsToSkipFromEval,
        subTreeSortOrder,
        configTree,
      });

    this.logs.push({
      sortedDependencies: this.sortedDependencies,
      inverse: this.inverseDependencyMap,
      updatedDependencyMap: this.dependencyMap,
      evaluationOrder: evaluationOrder,
      triggerFieldDependencyMap: this.triggerFieldDependencyMap,
    });

    // Remove any deleted paths from the eval tree
    removedPaths.forEach((removedPath) => {
      unset(this.evalTree, removedPath);
    });

    const cloneStartTime = performance.now();
    // TODO: For some reason we are passing some reference which are getting mutated.
    // Need to check why big api responses are getting split between two eval runs
    this.oldUnEvalTree = klona(localUnEvalTree);
    this.oldConfigTree = Object.assign({}, configTree);
    const cloneEndTime = performance.now();

    const totalUpdateTreeSetupEndTime = performance.now();

    const timeTakenForSetupUpdateTree = {
      total: getFixedTimeDifference(
        totalUpdateTreeSetupEndTime,
        totalUpdateTreeSetupStartTime,
      ),
      updateDependencyMap: updateDependencyMapTime,
      calculateSubTreeSortOrder: getFixedTimeDifference(
        calculateSortOrderEndTime,
        calculateSortOrderStartTime,
      ),
      findDifferences: findDifferenceTime,
      clone: getFixedTimeDifference(cloneEndTime, cloneStartTime),
    };

    this.logs.push({ timeTakenForSetupUpdateTree });

    return {
      unEvalUpdates: translatedDiffs,
      evalOrder: evaluationOrder,
      lintOrder: union(evaluationOrder, extraPathsToLint),
      nonDynamicFieldValidationOrder: Array.from(
        nonDynamicFieldValidationOrderSet,
      ),
      pathsToClearErrorsFor,
      isNewWidgetAdded,
    };
  }

  setupUpdateTreeWithDifferences(
    updatedValuePaths: string[][],
  ): ReturnType<typeof this.setupUpdateTree> {
    const localUnEvalTree = Object.assign({}, this.oldUnEvalTree);
    // skipped update local unEvalTree
    if (updatedValuePaths.length === 0) {
      return {
        unEvalUpdates: [],
        evalOrder: [],
        lintOrder: [],
        jsUpdates: {},
        nonDynamicFieldValidationOrder: [],
        pathsToClearErrorsFor: [],
        isNewWidgetAdded: false,
      };
    }

    /**
     *  Only evaluate the dependents of the updatedValue and
     *  skip the evaluation of updatedValue itself.
     *
     *  Example:
     *  if "JSObject.myVar1" is updated
     *  then => only re-evaluate values dependent on "JSObject.myVar1"
     */
    const pathsToSkipFromEval = updatedValuePaths.map((path) => path.join("."));

    return {
      ...this.setupTree(localUnEvalTree, updatedValuePaths, {
        pathsToSkipFromEval,
        configTree: this.oldConfigTree,
        isNewWidgetAdded: false,
      }),
      jsUpdates: {},
    };
  }

  evalAndValidateSubTree(
    evaluationOrder: string[],
    nonDynamicFieldValidationOrder: string[],
    configTree: ConfigTree,
    unevalUpdates: DataTreeDiff[],
    metaWidgetIds: string[] = [],
  ): {
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
  } {
    const evaluationStartTime = performance.now();

    const {
      evalMetaUpdates,
      evaluatedTree: newEvalTree,
      staleMetaIds,
    } = this.evaluateTree(
      this.evalTree,
      evaluationOrder,
      {
        skipRevalidation: false,
        isFirstTree: false,
        unevalUpdates,
        metaWidgets: metaWidgetIds,
      },
      configTree,
    );
    const evaluationEndTime = performance.now();
    const reValidateStartTime = performance.now();
    this.reValidateTree(
      nonDynamicFieldValidationOrder,
      newEvalTree,
      configTree,
    );
    const reValidateEndTime = performance.now();
    this.setEvalTree(newEvalTree);
    const timeTakenForEvalAndValidateSubTree = {
      evaluation: getFixedTimeDifference(
        evaluationEndTime,
        evaluationStartTime,
      ),
      revalidation: getFixedTimeDifference(
        reValidateEndTime,
        reValidateStartTime,
      ),
    };
    this.logs.push({ timeTakenForEvalAndValidateSubTree });
    return {
      evalMetaUpdates,
      staleMetaIds,
    };
  }

  getCompleteSortOrder(
    changes: Array<string>,
    inverseMap: DependencyMap,
  ): Array<string> {
    let finalSortOrder: Array<string> = [];
    let computeSortOrder = true;
    // Initialize parents with the current sent of property paths that need to be evaluated
    let parents = changes;
    let subSortOrderArray: Array<string>;
    while (computeSortOrder) {
      // Get all the nodes that would be impacted by the evaluation of the nodes in parents array in sorted order
      subSortOrderArray = this.getEvaluationSortOrder(parents, inverseMap);

      // Add all the sorted nodes in the final list
      finalSortOrder = [...finalSortOrder, ...subSortOrderArray];

      parents = getImmediateParentsOfPropertyPaths(subSortOrderArray);
      // If we find parents of the property paths in the sorted array, we should continue finding all the nodes dependent
      // on the parents
      computeSortOrder = parents.length > 0;
    }

    // Remove duplicates from this list. Since we explicitly walk down the tree and implicitly (by fetching parents) walk
    // up the tree, there are bound to be many duplicates.
    const uniqueKeysInSortOrder = new Set(finalSortOrder);

    // if a property path evaluation gets triggered by diff top order changes
    // this could lead to incorrect sort order in spite of the bfs traversal
    const sortOrderPropertyPaths: string[] = [];
    this.sortedDependencies.forEach((path) => {
      if (uniqueKeysInSortOrder.has(path)) {
        sortOrderPropertyPaths.push(path);
        // remove from the uniqueKeysInSortOrder
        uniqueKeysInSortOrder.delete(path);
      }
    });
    // Add any remaining paths in the uniqueKeysInSortOrder
    const completeSortOrder = [
      ...Array.from(uniqueKeysInSortOrder),
      ...sortOrderPropertyPaths,
    ];

    //Trim this list to now remove the property paths which are simply entity names
    const finalSortOrderArray: Array<string> = [];
    completeSortOrder.forEach((propertyPath) => {
      const lastIndexOfDot = propertyPath.lastIndexOf(".");
      // Only do this for property paths and not the entity themselves
      if (lastIndexOfDot !== -1) {
        finalSortOrderArray.push(propertyPath);
      }
    });

    return finalSortOrderArray;
  }

  getEvaluationSortOrder(
    changes: Array<string>,
    inverseMap: DependencyMap,
  ): Array<string> {
    const sortOrder: Array<string> = [...changes];
    let iterator = 0;
    while (iterator < sortOrder.length) {
      // Find all the nodes who are to be evaluated when sortOrder[iterator] changes
      const newNodes = inverseMap[sortOrder[iterator]];

      // If we find more nodes that would be impacted by the evaluation of the node being investigated
      // we add these to the sort order.
      if (newNodes) {
        newNodes.forEach((toBeEvaluatedNode) => {
          // Only add the nodes if they haven't been already added for evaluation in the list. Since we are doing
          // breadth first traversal, we should be safe in not changing the evaluation order and adding this now at this
          // point instead of the previous index found.
          if (!sortOrder.includes(toBeEvaluatedNode)) {
            sortOrder.push(toBeEvaluatedNode);
          }
        });
      }
      iterator++;
    }
    return sortOrder;
  }

  getPrivateWidgets(dataTree: DataTree): PrivateWidgets {
    let privateWidgets: PrivateWidgets = {};
    Object.keys(dataTree).forEach((entityName) => {
      const entity = dataTree[entityName];
      if (isWidget(entity) && !isEmpty(entity.privateWidgets)) {
        privateWidgets = {
          ...privateWidgets,
          ...entity.privateWidgets,
        };
      }
    });
    return privateWidgets;
  }

  evaluateTree(
    oldUnevalTree: DataTree,
    sortedDependencies: Array<string>,
    options: {
      skipRevalidation: boolean;
      isFirstTree: boolean;
      unevalUpdates: DataTreeDiff[];

      metaWidgets: string[];
    } = {
      skipRevalidation: true,
      isFirstTree: true,
      unevalUpdates: [],
      metaWidgets: [],
    },
    oldConfigTree: ConfigTree,
  ): {
    evaluatedTree: DataTree;
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
  } {
    const tree = klona(oldUnevalTree);
    errorModifier.updateAsyncFunctions(tree);
    const evalMetaUpdates: EvalMetaUpdates = [];
    const { isFirstTree, metaWidgets, skipRevalidation, unevalUpdates } =
      options;
    let staleMetaIds: string[] = [];
    try {
      const evaluatedTree = sortedDependencies.reduce(
        (currentTree: DataTree, fullPropertyPath: string) => {
          const { entityName, propertyPath } =
            getEntityNameAndPropertyPath(fullPropertyPath);
          const entity = currentTree[entityName] as WidgetEntity | ActionEntity;
          const unEvalPropertyValue = get(currentTree as any, fullPropertyPath);
          const entityConfig = oldConfigTree[entityName];

          const isADynamicBindingPath =
            (isAction(entity) || isWidget(entity) || isJSAction(entity)) &&
            isPathADynamicBinding(entityConfig, propertyPath);
          const isATriggerPath =
            isWidget(entity) &&
            isPathDynamicTrigger(
              entityConfig as WidgetEntityConfig,
              propertyPath,
            );
          let evalPropertyValue;
          const requiresEval =
            isADynamicBindingPath &&
            !isATriggerPath &&
            (isDynamicValue(unEvalPropertyValue) || isJSAction(entity));
          if (propertyPath) {
            set(this.evalProps, getEvalErrorPath(fullPropertyPath), []);
          }

          if (requiresEval) {
            const evaluationSubstitutionType =
              entityConfig.reactivePaths[propertyPath] ||
              EvaluationSubstitutionType.TEMPLATE;

            const contextData: EvaluateContext = {};
            if (isAction(entity)) {
              contextData.thisContext = {
                params: {},
              };
            }
            try {
              evalPropertyValue = this.getDynamicValue(
                unEvalPropertyValue,
                currentTree,
                oldConfigTree,
                evaluationSubstitutionType,
                contextData,
                undefined,
                fullPropertyPath,
              );
            } catch (error) {
              this.errors.push({
                type: EvalErrorTypes.EVAL_PROPERTY_ERROR,
                message: (error as Error).message,
                context: {
                  propertyPath: fullPropertyPath,
                },
              });
              evalPropertyValue = undefined;
            }
          } else {
            evalPropertyValue = unEvalPropertyValue;
          }
          if (isWidget(entity) && !isATriggerPath) {
            const isNewWidget =
              isFirstTree || isNewEntity(unevalUpdates, entityName);
            if (propertyPath) {
              const parsedValue = validateAndParseWidgetProperty({
                fullPropertyPath,
                widget: entity,
                currentTree,
                configTree: oldConfigTree,
                evalPropertyValue,
                unEvalPropertyValue,
                evalProps: this.evalProps,
              });

              this.setParsedValue({
                currentTree,
                configTree: oldConfigTree,
                entity,
                evalMetaUpdates,
                fullPropertyPath,
                parsedValue,
                propertyPath,
                evalPropertyValue,
                isNewWidget,
              });

              if (!skipRevalidation) {
                this.reValidateWidgetDependentProperty({
                  fullPropertyPath,
                  widget: entity,
                  currentTree,
                  configTree: oldConfigTree,
                });
              }
              staleMetaIds = staleMetaIds.concat(
                getStaleMetaStateIds({
                  entity,
                  entityConfig: entityConfig as WidgetEntityConfig,
                  propertyPath,
                  isNewWidget,
                  metaWidgets,
                }),
              );

              return currentTree;
            }
            return set(currentTree, fullPropertyPath, evalPropertyValue);
          } else if (isATriggerPath) {
            return currentTree;
          } else if (isAction(entity)) {
            if (this.allActionValidationConfig) {
              const configProperty = propertyPath.replace(
                "config",
                "actionConfiguration",
              );
              const validationConfig =
                !!this.allActionValidationConfig[entity.actionId] &&
                this.allActionValidationConfig[entity.actionId][configProperty];
              if (!!validationConfig && !isEmpty(validationConfig)) {
                this.validateActionProperty(
                  fullPropertyPath,
                  entity,
                  currentTree,
                  evalPropertyValue,
                  unEvalPropertyValue,
                  validationConfig,
                  oldConfigTree,
                );
              }
            }

            if (!propertyPath) return currentTree;
            set(
              this.evalProps,
              getEvalValuePath(fullPropertyPath),
              evalPropertyValue,
            );
            set(currentTree, fullPropertyPath, evalPropertyValue);
            return currentTree;
          } else if (isJSAction(entity)) {
            const variableList =
              (entityConfig as JSActionEntityConfig).variables || [];

            if (variableList.indexOf(propertyPath) > -1) {
              const prevEvaluatedValue = get(
                this.evalProps,
                getEvalValuePath(fullPropertyPath, {
                  isPopulated: true,
                  fullPath: true,
                }),
              );

              const prevUnEvalValue = JSObjectCollection.getPrevUnEvalState({
                fullPath: fullPropertyPath,
              });

              const hasUnEvalValueModified = !isEqual(
                prevUnEvalValue,
                unEvalPropertyValue,
              );

              const evalValue =
                !hasUnEvalValueModified && prevEvaluatedValue
                  ? prevEvaluatedValue
                  : evalPropertyValue;
              set(
                this.evalProps,
                getEvalValuePath(fullPropertyPath, {
                  isPopulated: true,
                  fullPath: true,
                }),
                evalValue,
              );
              set(currentTree, fullPropertyPath, evalValue);
              JSObjectCollection.setVariableValue(evalValue, fullPropertyPath);
              JSObjectCollection.setPrevUnEvalState({
                fullPath: fullPropertyPath,
                unEvalValue: unEvalPropertyValue,
              });
            }
            return currentTree;
          } else {
            return set(currentTree, fullPropertyPath, evalPropertyValue);
          }
        },
        tree,
      );

      return {
        evaluatedTree,
        evalMetaUpdates,
        staleMetaIds: staleMetaIds,
      };
    } catch (error) {
      this.errors.push({
        type: EvalErrorTypes.EVAL_TREE_ERROR,
        message: (error as Error).message,
      });
      return { evaluatedTree: tree, evalMetaUpdates, staleMetaIds: [] };
    }
  }

  setAllActionValidationConfig(allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  }): void {
    this.allActionValidationConfig = allActionValidationConfig;
  }

  sortDependencies(
    dependencyMap: DependencyMap,
    diffs?: (DataTreeDiff | DataTreeDiff[])[],
  ): Array<string> {
    /**
     * dependencyTree : Array<[Node, dependentNode]>
     */
    const dependencyTree: Array<[string, string]> = [];
    Object.keys(dependencyMap).forEach((key: string) => {
      if (dependencyMap[key].length) {
        dependencyMap[key].forEach((dep) => dependencyTree.push([key, dep]));
      } else {
        // Set no dependency
        dependencyTree.push([key, ""]);
      }
    });

    try {
      return toposort(dependencyTree)
        .reverse()
        .filter((d) => !!d);
    } catch (error) {
      // Cyclic dependency found. Extract all node and entity type
      const cyclicNodes = (error as Error).message.match(
        new RegExp('Cyclic dependency, node was:"(.*)"'),
      );

      const node = cyclicNodes?.length ? cyclicNodes[1] : "";

      let entityType = "UNKNOWN";
      const entityName = node.split(".")[0];
      const entity = get(this.oldUnEvalTree, entityName);
      const entityConfig = get(this.oldConfigTree, entityName);
      if (entity && isWidget(entity)) {
        entityType = entity.type;
      } else if (entity && isAction(entity)) {
        entityType = entityConfig.pluginType;
      } else if (entity && isJSAction(entity)) {
        entityType = entity.ENTITY_TYPE;
      }
      this.errors.push({
        type: EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR,
        message: "Cyclic dependency found while evaluating.",
        context: {
          node,
          entityType,
          dependencyMap,
          diffs,
        },
      });
      logError("CYCLICAL DEPENDENCY MAP", dependencyMap);
      this.hasCyclicalDependency = true;
      throw new CrashingError((error as Error).message);
    }
  }

  getDynamicValue(
    dynamicBinding: string,
    data: DataTree,
    configTree: ConfigTree,
    evaluationSubstitutionType: EvaluationSubstitutionType,
    contextData?: EvaluateContext,
    callBackData?: Array<any>,
    fullPropertyPath?: string,
  ) {
    // Get the {{binding}} bound values
    let entity: DataTreeEntity | undefined = undefined;
    let entityConfig: DataTreeEntityConfig | undefined = undefined;
    let propertyPath: string;
    if (fullPropertyPath) {
      const entityName = fullPropertyPath.split(".")[0];
      propertyPath = fullPropertyPath.split(".")[1];
      entity = data[entityName];
      entityConfig = configTree[entityName];
    }
    // Get the {{binding}} bound values
    const { jsSnippets, stringSegments } = getDynamicBindings(
      dynamicBinding,
      entity,
    );
    if (stringSegments.length) {
      // Get the Data Tree value of those "binding "paths
      const values = jsSnippets.map((jsSnippet, index) => {
        const toBeSentForEval =
          entity && isJSAction(entity) && propertyPath === "body"
            ? jsSnippet.replace(/export default/g, "")
            : jsSnippet;
        if (jsSnippet) {
          if (entity && entityConfig && !propertyPath.includes("body")) {
            ExecutionMetaData.setExecutionMetaData({
              triggerMeta: {
                source: {
                  id: getEntityId(entity) || "",
                  entityType: getEntityType(entity) || ENTITY_TYPE.WIDGET,
                  name: getEntityName(entity, entityConfig) || "",
                },
                triggerPropertyName: fullPropertyPath?.split(".")[1] || "",
              },
            });
          }

          const { errors: evalErrors, result } = this.evaluateDynamicBoundValue(
            toBeSentForEval,
            data,
            !!entity && isJSAction(entity),
            contextData,
            callBackData,
          );
          if (fullPropertyPath && evalErrors.length) {
            addErrorToEntityProperty({
              errors: addRootcauseToAsyncInvocationErrors(
                fullPropertyPath,
                configTree,
                evalErrors,
              ),
              evalProps: this.evalProps,
              fullPropertyPath,
              dataTree: data,
              configTree,
            });
          }
          return result;
        } else {
          return stringSegments[index];
        }
      });

      // We don't need to substitute template of the result if only one binding exists
      // But it should not be of prepared statements since that does need a string
      if (
        stringSegments.length === 1 &&
        evaluationSubstitutionType !== EvaluationSubstitutionType.PARAMETER
      ) {
        return values[0];
      }
      try {
        // else return a combined value according to the evaluation type
        return substituteDynamicBindingWithValues(
          dynamicBinding,
          stringSegments,
          values,
          evaluationSubstitutionType,
        );
      } catch (error) {
        if (fullPropertyPath) {
          addErrorToEntityProperty({
            errors: [
              {
                raw: dynamicBinding,
                errorType: PropertyEvaluationErrorType.PARSE,
                errorMessage: {
                  name: (error as Error).name,
                  message: (error as Error).message,
                },
                severity: Severity.ERROR,
              },
            ],
            evalProps: this.evalProps,
            fullPropertyPath,
            dataTree: data,
            configTree,
          });
        }
        return undefined;
      }
    }
    return undefined;
  }

  async evaluateTriggers(
    userScript: string,
    dataTree: DataTree,
    callbackData: Array<unknown>,
    context?: EvaluateContext,
  ) {
    const { jsSnippets } = getDynamicBindings(userScript);

    return evaluateAsync(
      jsSnippets[0] || userScript,
      dataTree,
      context,
      callbackData,
    );
  }

  // Paths are expected to have "{name}.{path}" signature
  // Also returns any action triggers found after evaluating value
  evaluateDynamicBoundValue(
    js: string,
    data: DataTree,
    isJSObject: boolean,
    contextData?: EvaluateContext,
    callbackData?: Array<any>,
  ): EvalResult {
    let evalResponse: EvalResult;
    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: false,
      enableJSFnPostProcessors: false,
    });
    try {
      evalResponse = evaluateSync(
        js,
        data,
        isJSObject,
        contextData,
        callbackData,
      );
    } catch (error) {
      evalResponse = {
        result: undefined,
        errors: [
          {
            errorType: PropertyEvaluationErrorType.PARSE,
            raw: js,
            severity: Severity.ERROR,
            errorMessage: {
              name: (error as Error).name,
              message: (error as Error).message,
            },
          },
        ],
      };
    }
    ExecutionMetaData.setExecutionMetaData({
      enableJSVarUpdateTracking: true,
      enableJSFnPostProcessors: true,
    });
    return evalResponse;
  }

  setParsedValue({
    configTree,
    currentTree,
    entity,
    evalMetaUpdates,
    evalPropertyValue,
    fullPropertyPath,
    isNewWidget,
    parsedValue,
    propertyPath,
  }: {
    currentTree: DataTree;
    configTree: ConfigTree;
    entity: WidgetEntity;
    evalMetaUpdates: EvalMetaUpdates;
    fullPropertyPath: string;
    isNewWidget: boolean;
    parsedValue: unknown;
    propertyPath: string;
    evalPropertyValue: unknown;
  }) {
    const overwriteObj = overrideWidgetProperties({
      entity,
      propertyPath,
      value: parsedValue,
      currentTree,
      configTree,
      evalMetaUpdates,
      fullPropertyPath,
      isNewWidget,
    });

    if (overwriteObj && overwriteObj.overwriteParsedValue) {
      parsedValue = overwriteObj.newValue;
    }
    // setting parseValue in dataTree
    set(currentTree, fullPropertyPath, parsedValue);
    // setting evalPropertyValue in unParsedEvalTree
    set(this.getUnParsedEvalTree(), fullPropertyPath, evalPropertyValue);
  }

  reValidateWidgetDependentProperty({
    configTree,
    currentTree,
    fullPropertyPath,
    widget,
  }: {
    fullPropertyPath: string;
    widget: WidgetEntity;
    currentTree: DataTree;
    configTree: ConfigTree;
  }) {
    if (this.inverseValidationDependencyMap[fullPropertyPath]) {
      const pathsToRevalidate =
        this.inverseValidationDependencyMap[fullPropertyPath];
      pathsToRevalidate.forEach((fullPath) => {
        validateAndParseWidgetProperty({
          fullPropertyPath: fullPath,
          widget,
          currentTree,
          configTree,
          // we supply non-transformed evaluated value
          evalPropertyValue: get(this.getUnParsedEvalTree(), fullPath),
          unEvalPropertyValue: get(
            this.oldUnEvalTree,
            fullPath,
          ) as unknown as string,
          evalProps: this.evalProps,
        });
      });
    }
  }

  reValidateTree(
    nonDynamicFieldValidationOrder: string[],
    currentTree: DataTree,
    configTree: ConfigTree,
  ) {
    nonDynamicFieldValidationOrder.forEach((fullPropertyPath) => {
      const { entityName, propertyPath } =
        getEntityNameAndPropertyPath(fullPropertyPath);
      const entity = currentTree[entityName];
      if (isWidget(entity) && !isPathDynamicTrigger(entity, propertyPath)) {
        this.reValidateWidgetDependentProperty({
          widget: entity,
          fullPropertyPath,
          currentTree,
          configTree,
        });
      }
    });
  }

  // validates the user input saved as action property based on a validationConfig
  validateActionProperty(
    fullPropertyPath: string,
    action: ActionEntity,
    currentTree: DataTree,
    evalPropertyValue: any,
    unEvalPropertyValue: string,
    validationConfig: ValidationConfig,
    configTree: ConfigTree,
  ) {
    if (evalPropertyValue && validationConfig) {
      // runs VALIDATOR function and returns errors
      const { isValid, messages } = validateActionProperty(
        validationConfig,
        evalPropertyValue,
      );
      if (!isValid) {
        const evalErrors: EvaluationError[] =
          messages?.map((message) => {
            return {
              raw: unEvalPropertyValue,
              errorMessage: message || { name: "", text: "" },
              errorType: PropertyEvaluationErrorType.VALIDATION,
              severity: Severity.ERROR,
            };
          }) ?? [];
        // saves error in dataTree at fullPropertyPath
        // Later errors can consumed by the forms and debugger
        addErrorToEntityProperty({
          errors: evalErrors,
          evalProps: this.evalProps,
          fullPropertyPath,
          dataTree: currentTree,
          configTree,
        });
      }
    }
  }

  /**
   * Update the entity config set as prototype according to latest unEvalTree changes else code would consume stale configs.
   *
   * Example scenario: On addition of a JS binding to widget, it's dynamicBindingPathList changes and needs to be updated.
   */
  updateConfigForModifiedEntity(unEvalTree: DataTree, entityName: string) {
    const unEvalEntity = unEvalTree[entityName];
    // skip entity if entity is not present in the evalTree or is not a valid entity
    if (!this.evalTree[entityName] || !isValidEntity(this.evalTree[entityName]))
      return;
    const entityConfig = Object.getPrototypeOf(unEvalEntity);
    const newEntityObject = Object.create(entityConfig);
    this.evalTree[entityName] = Object.assign(newEntityObject, {
      ...this.evalTree[entityName],
    });
  }

  updateEvalTreeWithChanges({
    differences,
  }: {
    differences: Diff<any, any>[];
  }) {
    for (const d of differences) {
      if (!Array.isArray(d.path) || d.path.length === 0) continue; // Null check for typescript
      // Apply the changes into the evalTree so that it gets the latest changes
      applyChange(this.evalTree, undefined, d);
    }
  }

  calculateSubTreeSortOrder(
    updatedValuePaths: string[][],
    dependenciesOfRemovedPaths: Array<string>,
    removedPaths: Array<string>,
    unEvalTree: DataTree,
    configTree: ConfigTree,
  ) {
    const changePaths: Set<string> = new Set(dependenciesOfRemovedPaths);
    for (const path of updatedValuePaths) {
      changePaths.add(convertPathToString(path));
      // If this is a property path change, simply add for evaluation and move on
      if (!isDynamicLeaf(unEvalTree, convertPathToString(path), configTree)) {
        // A parent level property has been added or deleted
        /**
         * We want to add all pre-existing dynamic and static bindings in dynamic paths of this entity to get evaluated and validated.
         * Example:
         * - Table1.tableData = {{Api1.data}}
         * - Api1 gets created.
         * - This function gets called with a diff {path:["Api1"]}
         * We want to add `Api.data` to changedPaths so that `Table1.tableData` can be discovered below.
         */
        const entityName = path[0];
        const entityConfig = configTree[entityName];
        const entity = unEvalTree[entityName];
        if (!entity) {
          continue;
        }
        if (!isAction(entity) && !isWidget(entity) && !isJSAction(entity)) {
          continue;
        }
        let entityDynamicBindingPaths: string[] = [];
        if (isAction(entity)) {
          const entityDynamicBindingPathList =
            getEntityDynamicBindingPathList(entityConfig);
          entityDynamicBindingPaths = entityDynamicBindingPathList.map(
            (path) => {
              return path.key;
            },
          );
        }
        const parentPropertyPath = convertPathToString(path);
        Object.keys(entityConfig.reactivePaths).forEach((relativePath) => {
          const childPropertyPath = `${entityName}.${relativePath}`;
          // Check if relative path has dynamic binding
          if (
            entityDynamicBindingPaths &&
            entityDynamicBindingPaths.length &&
            entityDynamicBindingPaths.includes(relativePath)
          ) {
            changePaths.add(childPropertyPath);
          }
          if (isChildPropertyPath(parentPropertyPath, childPropertyPath)) {
            changePaths.add(childPropertyPath);
          }
        });
      }
    }

    // If a nested property path has changed and someone (say x) is dependent on the parent of the said property,
    // x must also be evaluated. For example, the following relationship exists in dependency map:
    // <  "Input1.defaultText" : ["Table1.selectedRow.email"] >
    // If Table1.selectedRow has changed, then Input1.defaultText must also be evaluated because Table1.selectedRow.email
    // is a nested property of Table1.selectedRow
    const changePathsWithNestedDependants = addDependantsOfNestedPropertyPaths(
      Array.from(changePaths),
      this.inverseDependencyMap,
    );

    const trimmedChangedPaths = trimDependantChangePaths(
      changePathsWithNestedDependants,
      this.dependencyMap,
    );

    // Now that we have all the root nodes which have to be evaluated, recursively find all the other paths which
    // would get impacted because they are dependent on the said root nodes and add them in order
    const completeSortOrder = this.getCompleteSortOrder(
      trimmedChangedPaths,
      this.inverseDependencyMap,
    );

    // Remove any paths that do not exist in the data tree anymore
    return difference(completeSortOrder, removedPaths);
  }

  getInverseDependencyTree(
    params = {
      dependencyMap: this.dependencyMap,
      sortedDependencies: this.sortedDependencies,
    },
  ): DependencyMap {
    const { dependencyMap, sortedDependencies } = params;
    const inverseDependencyMap: DependencyMap = {};
    sortedDependencies.forEach((propertyPath) => {
      const incomingEdges: Array<string> = dependencyMap[propertyPath];
      if (incomingEdges) {
        incomingEdges.forEach((edge) => {
          const node = inverseDependencyMap[edge];
          if (node) {
            node.push(propertyPath);
          } else {
            inverseDependencyMap[edge] = [propertyPath];
          }
        });
      }
    });
    return inverseDependencyMap;
  }

  evaluateActionBindings(
    bindings: string[],
    executionParams?: Record<string, unknown> | string,
  ) {
    // We might get execution params as an object or as a string.
    // If the user has added a proper object (valid case) it will be an object
    // If they have not added any execution params or not an object
    // it would be a string (invalid case)
    let evaluatedExecutionParams: Record<string, any> = {};
    if (executionParams && isObject(executionParams)) {
      evaluatedExecutionParams = this.getDynamicValue(
        `{{${JSON.stringify(executionParams)}}}`,
        this.evalTree,
        this.oldConfigTree,
        EvaluationSubstitutionType.TEMPLATE,
      );
    }

    return bindings.map((binding) => {
      // Replace any reference of 'this.params' to 'executionParams' (backwards compatibility)
      // also helps with dealing with IIFE which are normal functions (not arrow)
      // because normal functions won't retain 'this' context (when executed elsewhere)
      const replacedBinding = binding.replace(
        EXECUTION_PARAM_REFERENCE_REGEX,
        EXECUTION_PARAM_KEY,
      );
      return this.getDynamicValue(
        `{{${replacedBinding}}}`,
        this.evalTree,
        this.oldConfigTree,
        EvaluationSubstitutionType.TEMPLATE,
        // params can be accessed via "this.params" or "executionParams"
        {
          thisContext: {
            [THIS_DOT_PARAMS_KEY]: evaluatedExecutionParams,
          },
          globalContext: {
            [EXECUTION_PARAM_KEY]: evaluatedExecutionParams,
          },
        },
      );
    });
  }

  clearErrors() {
    this.errors = [];
  }
  clearLogs() {
    this.logs = [];
  }
}
