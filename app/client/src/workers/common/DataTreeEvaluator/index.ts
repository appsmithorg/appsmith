import type {
  DataTreeEvaluationProps,
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
  isPathDynamicTrigger,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import type { WidgetTypeConfigMap } from "WidgetProvider/factory";
import type {
  WidgetEntity,
  WidgetEntityConfig,
  DataTreeEntityConfig,
  ActionEntity,
  JSActionEntity,
  JSActionEntityConfig,
  PrivateWidgets,
  ActionEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type {
  DataTree,
  DataTreeEntity,
  ConfigTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE_VALUE } from "@appsmith/entities/DataTree/types";
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
  isNewEntity,
  getStaleMetaStateIds,
  convertJSFunctionsToString,
  DataTreeDiffEvent,
  resetValidationErrorsForEntityProperty,
  isAPathDynamicBindingPath,
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
  isUndefined,
  set,
  union,
  unset,
} from "lodash";

import type { Diff } from "deep-diff";
import { applyChange, diff } from "deep-diff";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
  THIS_DOT_PARAMS_KEY,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { EvalResult, EvaluateContext } from "workers/Evaluation/evaluate";
import evaluateSync, {
  evaluateAsync,
  setEvalContext,
} from "workers/Evaluation/evaluate";
import { substituteDynamicBindingWithValues } from "workers/Evaluation/evaluationSubstitution";
import { Severity } from "entities/AppsmithConsole";
import { error as logError } from "loglevel";
import type { JSUpdate } from "utils/JSPaneUtils";

import type {
  ActionValidationConfigMap,
  ValidationConfig,
} from "constants/PropertyControlConstants";
import { klona } from "klona/full";
import { klona as klonaJSON } from "klona/json";
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
import { getFixedTimeDifference, replaceThisDotParams } from "./utils";
import { isJSObjectFunction } from "workers/Evaluation/JSObject/utils";
import {
  setToEvalPathsIdenticalToState,
  validateActionProperty,
  validateAndParseWidgetProperty,
  validateWidgetProperty,
} from "./validationUtils";
import { errorModifier } from "workers/Evaluation/errorModifier";
import JSObjectCollection from "workers/Evaluation/JSObject/Collection";
import userLogs from "workers/Evaluation/fns/overrides/console";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import DependencyMap from "entities/DependencyMap";
import { DependencyMapUtils } from "entities/DependencyMap/DependencyMapUtils";
import { isWidgetActionOrJsObject } from "@appsmith/entities/DataTree/utils";
import DataStore from "workers/Evaluation/dataStore";
import { updateTreeWithData } from "workers/Evaluation/dataStore/utils";

type SortedDependencies = Array<string>;
export interface EvalProps {
  [entityName: string]: DataTreeEvaluationProps;
}

export type EvalPathsIdenticalToState = Record<string, string>;
export default class DataTreeEvaluator {
  dependencyMap: DependencyMap = new DependencyMap();
  sortedDependencies: SortedDependencies = [];
  dependencies: Record<string, string[]> = {};
  inverseDependencies: Record<string, string[]> = {};
  widgetConfigMap: WidgetTypeConfigMap = {};
  evalTree: DataTree = {};
  configTree: ConfigTree = {};

  /**
   * This contains raw evaluated value without any validation or parsing.
   * This is used for revalidation as we do not store the raw validated value.
   */
  unParsedEvalTree: DataTree = {};
  allKeys: Record<string, true> = {};
  privateWidgets: PrivateWidgets = {};
  oldUnEvalTree: UnEvalTree = {};
  oldConfigTree: ConfigTree = {};
  errors: EvalError[] = [];
  logs: unknown[] = [];
  console = userLogs;
  allActionValidationConfig?: {
    [actionId: string]: ActionValidationConfigMap;
  };

  /**
   * Sanitized eval values and errors
   */
  evalProps: EvalProps = {};
  //when attaching values to __evaluations__ segment of the state there are cases where this value is identical to the widget property
  //in those cases do not it to the dataTree and update this map. The main thread can decompress these updates and we can minimise the data transfer
  evalPathsIdenticalToState: EvalPathsIdenticalToState = {};
  undefinedEvalValuesMap: Record<string, boolean> = {};

  prevState = {};
  setPrevState(state: any) {
    this.prevState = state;
  }
  getPrevState() {
    return this.prevState;
  }
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

  getEvalPathsIdenticalToState(): EvalPathsIdenticalToState {
    return this.evalPathsIdenticalToState || {};
  }
  getEvalTree() {
    return this.evalTree;
  }

  getEvalProps() {
    return this.evalProps;
  }

  setEvalTree(evalTree: DataTree) {
    this.evalTree = evalTree;
  }

  getConfigTree() {
    return this.configTree;
  }

  setConfigTree(configTree: ConfigTree) {
    if (configTree) this.configTree = configTree;
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
  } {
    this.setConfigTree(configTree);

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
    const parseJSActionsStartTime = performance.now();
    const parsedCollections = parseJSActions(this, localUnEvalTree);
    const parseJSActionsEndTime = performance.now();

    jsUpdates = parsedCollections.jsUpdates;
    localUnEvalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
      jsUpdates,
      localUnEvalTree,
      configTree,
    );
    const localUnEvalTreeJSCollection = getJSEntities(localUnEvalTree);
    const stringifiedLocalUnEvalTreeJSCollection = convertJSFunctionsToString(
      localUnEvalTreeJSCollection,
      configTree,
    );
    const unEvalTreeWithStrigifiedJSFunctions = Object.assign(
      {},
      localUnEvalTree,
      stringifiedLocalUnEvalTreeJSCollection,
    );
    const allKeysGenerationStartTime = performance.now();
    this.allKeys = getAllPaths(unEvalTreeWithStrigifiedJSFunctions);
    const allKeysGenerationEndTime = performance.now();

    const createDependencyMapStartTime = performance.now();
    const { dependencies, inverseDependencies } = createDependencyMap(
      this,
      localUnEvalTree,
      configTree,
    );
    const createDependencyMapEndTime = performance.now();

    this.dependencies = dependencies;
    this.inverseDependencies = inverseDependencies;

    const sortDependenciesStartTime = performance.now();
    this.sortedDependencies = this.sortDependencies(this.dependencyMap);
    const sortDependenciesEndTime = performance.now();

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
      parseJSActions: getFixedTimeDifference(
        parseJSActionsEndTime,
        parseJSActionsStartTime,
      ),
    };
    this.logs.push({
      timeTakenForSetupFirstTree,
      dependencies: this.dependencies,
      inverseDependencies: this.inverseDependencies,
    });
    return {
      jsUpdates,
      evalOrder: this.sortedDependencies,
    };
  }

  /**
   * Mutates the dataTree.
   * Validates all the nodes of the tree to make sure all the values are as expected according to the validation config
   *
   * For example :- If Button.isDisabled is set to false in propertyPane then it would be passed as "false" in unEvalTree and validateTree method makes sure to convert it to boolean.
   * @param tree
   * @param option
   * @param configTree
   * @returns
   */
  validatedTree(
    dataTree: DataTree,
    option: {
      evalProps: EvalProps;
      evalPathsIdenticalToState: EvalPathsIdenticalToState;
    },
    configTree: ConfigTree,
  ) {
    const unParsedEvalTree = this.getUnParsedEvalTree();
    const { evalPathsIdenticalToState, evalProps } = option;
    for (const [entityName, entity] of Object.entries(dataTree)) {
      if (!isWidget(entity)) continue;
      const entityConfig = configTree[entityName] as WidgetEntityConfig;
      const validationPathsMap = Object.entries(entityConfig.validationPaths);

      for (const [propertyPath, validationConfig] of validationPathsMap) {
        const fullPropertyPath = `${entityName}.${propertyPath}`;

        const value = get(
          unParsedEvalTree,
          fullPropertyPath,
          get(entity, propertyPath),
        );
        // Pass it through parse
        const { isValid, messages, parsed, transformed } =
          validateWidgetProperty(validationConfig, value, entity, propertyPath);

        set(entity, propertyPath, parsed);

        const evaluatedValue = isValid
          ? parsed
          : isUndefined(transformed)
          ? value
          : transformed;

        const isParsedValueTheSame = parsed === evaluatedValue;

        const evalPath = getEvalValuePath(fullPropertyPath, {
          isPopulated: false,
          fullPath: true,
        });

        setToEvalPathsIdenticalToState({
          evalPath,
          evalPathsIdenticalToState,
          evalProps,
          isParsedValueTheSame,
          fullPropertyPath,
          value: evaluatedValue,
        });

        resetValidationErrorsForEntityProperty({
          evalProps,
          fullPropertyPath,
        });

        if (!isValid) {
          const evalErrors: EvaluationError[] =
            messages?.map((message) => ({
              errorType: PropertyEvaluationErrorType.VALIDATION,
              errorMessage: message ?? {},
              severity: Severity.ERROR,
              raw: value,
            })) ?? [];

          addErrorToEntityProperty({
            errors: evalErrors,
            evalProps,
            fullPropertyPath,
            configTree,
          });
        }
      }
    }
  }

  evalAndValidateFirstTree(): {
    evalTree: DataTree;
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
  } {
    const evaluationStartTime = performance.now();

    const evaluationOrder = this.sortedDependencies;

    const unEvalTreeClone = klonaJSON(this.oldUnEvalTree);
    // Evaluate
    const { evalMetaUpdates, evaluatedTree, staleMetaIds } = this.evaluateTree(
      unEvalTreeClone,
      evaluationOrder,
      undefined,
      this.oldConfigTree,
    );

    /**
     * We need to re-validate all widgets only in case of first tree
     * Widget fields with custom validation functions can depend on other properties of the widget,
     * which aren't evaluated/validated yet, thereby store incorrect validation errors in the previous step
     */
    this.validatedTree(
      evaluatedTree,
      {
        evalProps: this.evalProps,
        evalPathsIdenticalToState: this.evalPathsIdenticalToState,
      },
      this.oldConfigTree,
    );

    const evaluationEndTime = performance.now();

    this.setEvalTree(evaluatedTree);

    const timeTakenForEvalAndValidateFirstTree = {
      evaluation: getFixedTimeDifference(
        evaluationEndTime,
        evaluationStartTime,
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
    jsUpdates: Record<string, JSUpdate>;
    removedPaths: Array<{ entityId: string; fullpath: string }>;
    isNewWidgetAdded: boolean;
  } {
    this.setConfigTree(configTree);
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

    const oldUnEvalTreeWithStringifiedJSFunctions = Object.assign(
      {},
      this.oldUnEvalTree,
      stringifiedOldUnEvalTreeJSCollections,
    );

    const localUnEvalTreeWithStringifiedJSFunctions = Object.assign(
      {},
      localUnEvalTree,
      stringifiedLocalUnEvalTreeJSCollection,
    );

    const differences: Diff<DataTree, DataTree>[] =
      diff(
        oldUnEvalTreeWithStringifiedJSFunctions,
        localUnEvalTreeWithStringifiedJSFunctions,
      ) || [];
    // Since eval tree is listening to possible events that don't cause differences
    // We want to check if no diffs are present and bail out early
    if (differences.length === 0) {
      return {
        removedPaths: [],
        unEvalUpdates: [],
        evalOrder: [],
        jsUpdates: {},
        isNewWidgetAdded: false,
      };
    }
    DataStore.update(differences);
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

    const updateDependencyStartTime = performance.now();
    // TODO => Optimize using dataTree diff
    this.allKeys = getAllPaths(localUnEvalTreeWithStringifiedJSFunctions);
    // Find all the paths that have changed as part of the difference and update the
    // global dependency map if an existing dynamic binding has now become legal
    const {
      dependencies,
      dependenciesOfRemovedPaths,
      inverseDependencies,
      removedPaths,
    } = updateDependencyMap({
      configTree,
      dataTreeEvalRef: this,
      translatedDiffs,
      unEvalDataTree: localUnEvalTree,
    });
    const updateDependencyEndTime = performance.now();

    this.dependencies = dependencies;
    this.inverseDependencies = inverseDependencies;

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
    this.logs.push({
      differences,
      translatedDiffs,
    });

    return {
      ...this.setupTree(localUnEvalTree, updatedValuePaths, {
        totalUpdateTreeSetupStartTime,
        dependenciesOfRemovedPaths,
        removedPaths,
        translatedDiffs,
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

    for (const fullPath of subTreeSortOrder) {
      if (pathsToSkipFromEval.includes(fullPath)) continue;

      if (!isDynamicLeaf(localUnEvalTree, fullPath, configTree)) continue;

      const unEvalPropValue = get(localUnEvalTree, fullPath);
      const evalPropValue = get(this.evalTree, fullPath);
      evaluationOrder.push(fullPath);
      if (isFunction(evalPropValue)) continue;
      // Set all values from unEvalTree to the evalTree to run evaluation for unevaluated values.
      set(this.evalTree, fullPath, unEvalPropValue);
    }

    return { evaluationOrder };
  }

  setupTree(
    localUnEvalTree: UnEvalTree,
    updatedValuePaths: string[][],
    extraParams: {
      totalUpdateTreeSetupStartTime?: any;
      dependenciesOfRemovedPaths?: string[];
      removedPaths?: Array<{ entityId: string; fullpath: string }>;
      translatedDiffs?: DataTreeDiff[];
      pathsToSkipFromEval?: string[];
      findDifferenceTime?: string;
      updateDependencyMapTime?: string;
      configTree: ConfigTree;
      isNewWidgetAdded: boolean;
    },
  ) {
    const {
      configTree,
      dependenciesOfRemovedPaths = [],
      findDifferenceTime = "0",
      isNewWidgetAdded,
      pathsToSkipFromEval = [],
      removedPaths = [],
      totalUpdateTreeSetupStartTime = performance.now(),
      translatedDiffs = [],
      updateDependencyMapTime = "0",
    } = extraParams;

    updateEvalTreeWithJSCollectionState(this.evalTree);

    const calculateSortOrderStartTime = performance.now();
    const subTreeSortOrder: string[] = this.calculateSubTreeSortOrder(
      updatedValuePaths,
      dependenciesOfRemovedPaths,
      removedPaths,
      localUnEvalTree,
      configTree,
    );
    const calculateSortOrderEndTime = performance.now();

    const { evaluationOrder } = this.getEvaluationOrder({
      localUnEvalTree,
      pathsToSkipFromEval,
      subTreeSortOrder,
      configTree,
    });

    this.logs.push({
      sortedDependencies: this.sortedDependencies,
      inverseDependencies: this.inverseDependencies,
      updatedDependencies: this.dependencies,
      evaluationOrder: evaluationOrder,
    });

    // Remove any deleted paths from the eval tree
    removedPaths.forEach((removedPath) => {
      unset(this.evalTree, removedPath.fullpath);
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
      removedPaths,
      isNewWidgetAdded,
    };
  }

  setupUpdateTreeWithDifferences(
    updatedValuePaths: string[][],
  ): ReturnType<typeof DataTreeEvaluator.prototype.setupUpdateTree> {
    const localUnEvalTree = Object.assign({}, this.oldUnEvalTree);
    // skipped update local unEvalTree
    if (updatedValuePaths.length === 0) {
      return {
        unEvalUpdates: [],
        evalOrder: [],
        jsUpdates: {},
        removedPaths: [],
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
    configTree: ConfigTree,
    unevalUpdates: DataTreeDiff[],
    metaWidgetIds: string[] = [],
  ): {
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
    contextTree: DataTree;
  } {
    const evaluationStartTime = performance.now();

    const {
      contextTree,
      evalMetaUpdates,
      evaluatedTree: newEvalTree,
      staleMetaIds,
    } = this.evaluateTree(
      this.evalTree,
      evaluationOrder,
      {
        isFirstTree: false,
        unevalUpdates,
        metaWidgets: metaWidgetIds,
      },
      configTree,
    );
    const evaluationEndTime = performance.now();

    this.setEvalTree(newEvalTree);

    const timeTakenForEvalAndValidateSubTree = {
      evaluation: getFixedTimeDifference(
        evaluationEndTime,
        evaluationStartTime,
      ),
    };
    this.logs.push({ timeTakenForEvalAndValidateSubTree });
    return {
      evalMetaUpdates,
      staleMetaIds,
      contextTree,
    };
  }

  getCompleteSortOrder(
    changes: Array<string>,
    inverseMap: Record<string, string[]>,
  ): Array<string> {
    let finalSortOrder: Array<string> = [];
    let computeSortOrder = true;
    // Initialize parents with the current sent of property paths that need to be evaluated
    let parents = changes;
    let subSortOrderArray: Array<string>;
    let visitedNodes: string[] = [];
    while (computeSortOrder) {
      // Get all the nodes that would be impacted by the evaluation of the nodes in parents array in sorted order
      subSortOrderArray = this.getEvaluationSortOrder(parents, inverseMap);
      visitedNodes = union(visitedNodes, parents);
      // Add all the sorted nodes in the final list
      finalSortOrder = union(finalSortOrder, subSortOrderArray);

      parents = getImmediateParentsOfPropertyPaths(subSortOrderArray);
      // If we find parents of the property paths in the sorted array, we should continue finding all the nodes dependent
      // on the parents
      computeSortOrder = difference(parents, visitedNodes).length > 0;
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
    inverseMap: Record<string, string[]>,
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
    unEvalTree: DataTree,
    evaluationOrder: Array<string>,
    options: {
      isFirstTree: boolean;
      unevalUpdates: DataTreeDiff[];
      metaWidgets: string[];
    } = {
      isFirstTree: true,
      unevalUpdates: [],
      metaWidgets: [],
    },
    oldConfigTree: ConfigTree,
  ): {
    evaluatedTree: DataTree;
    evalMetaUpdates: EvalMetaUpdates;
    staleMetaIds: string[];
    contextTree: DataTree;
  } {
    const safeTree = klona(unEvalTree);
    const dataStore = DataStore.getDataStore();
    const dataStoreClone = klonaJSON(dataStore);

    updateTreeWithData(safeTree, dataStoreClone);
    updateTreeWithData(unEvalTree, dataStore);

    /**
     * contextTree is a mutable dataTree, it gets passed as a context for each evaluation
     * and gets updated both, with evaluated values and mutations.
     *
     * SafeTree is free of mutations because we make sure to only set evaluated values into it.
     */
    const contextTree = unEvalTree;
    errorModifier.updateAsyncFunctions(
      contextTree,
      this.getConfigTree(),
      this.dependencyMap,
    );

    const evalMetaUpdates: EvalMetaUpdates = [];
    const { isFirstTree, metaWidgets, unevalUpdates } = options;
    let staleMetaIds: string[] = [];
    try {
      for (const fullPropertyPath of evaluationOrder) {
        const { entityName, propertyPath } =
          getEntityNameAndPropertyPath(fullPropertyPath);
        const entity = contextTree[entityName];
        const entityConfig = oldConfigTree[entityName];
        if (!isWidgetActionOrJsObject(entity)) continue;

        let unEvalPropertyValue = get(contextTree as any, fullPropertyPath);

        const isADynamicBindingPath = isAPathDynamicBindingPath(
          entity,
          entityConfig,
          propertyPath,
        );

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
            // Add empty object for this.params to avoid undefined errors
            contextData.globalContext = {
              [THIS_DOT_PARAMS_KEY]: {},
            };

            unEvalPropertyValue = replaceThisDotParams(unEvalPropertyValue);
          }
          try {
            evalPropertyValue = this.getDynamicValue(
              unEvalPropertyValue,
              contextTree,
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

        this.updateUndefinedEvalValuesMap(
          this.undefinedEvalValuesMap,
          evalPropertyValue,
          fullPropertyPath,
        );

        const entityType = entity.ENTITY_TYPE;
        if (!propertyPath) continue;
        switch (entityType) {
          case ENTITY_TYPE_VALUE.WIDGET: {
            if (isATriggerPath) continue;

            const isNewWidget =
              isFirstTree || isNewEntity(unevalUpdates, entityName);

            const widgetEntity = entity as WidgetEntity;

            let parsedValue = validateAndParseWidgetProperty({
              fullPropertyPath,
              widget: widgetEntity,
              configTree: oldConfigTree,
              evalPropertyValue,
              unEvalPropertyValue,
              evalProps: this.evalProps,
              evalPathsIdenticalToState: this.evalPathsIdenticalToState,
            });

            parsedValue = this.getParsedValueForWidgetProperty({
              currentTree: contextTree,
              configTree: oldConfigTree,
              entity: widgetEntity,
              evalMetaUpdates,
              fullPropertyPath,
              parsedValue,
              propertyPath,
              isNewWidget,
              safeTree,
            });

            // setting evalPropertyValue in unParsedEvalTree
            set(
              this.getUnParsedEvalTree(),
              fullPropertyPath,
              evalPropertyValue,
            );

            set(contextTree, fullPropertyPath, parsedValue);
            set(safeTree, fullPropertyPath, klona(parsedValue));

            staleMetaIds = staleMetaIds.concat(
              getStaleMetaStateIds({
                entity: widgetEntity,
                entityConfig: entityConfig as WidgetEntityConfig,
                propertyPath,
                isNewWidget,
                metaWidgets,
              }),
            );
            break;
          }
          case ENTITY_TYPE_VALUE.ACTION: {
            const actionEntity = entity as ActionEntity;

            const configProperty = propertyPath.replace(
              "config",
              "actionConfiguration",
            );
            const validationConfig =
              this.allActionValidationConfig?.[actionEntity.actionId]?.[
                configProperty
              ];
            this.validateActionProperty(
              fullPropertyPath,
              actionEntity,
              contextTree,
              evalPropertyValue,
              unEvalPropertyValue,
              oldConfigTree,
              validationConfig,
            );

            if (!propertyPath) continue;

            const evalPath = getEvalValuePath(fullPropertyPath);
            setToEvalPathsIdenticalToState({
              evalPath,
              evalPathsIdenticalToState: this.evalPathsIdenticalToState,
              evalProps: this.evalProps,
              isParsedValueTheSame: true,
              fullPropertyPath,
              value: evalPropertyValue,
            });

            /**
             * Perf optimization very specific to handling actions
             * Fields like Api1.data doesn't get evaluated since it is not in dynamicBindingPathList
             * Action validation only captures validation error and doesn't transform the evaluated values.
             * This means that the values we are looking to set back in the 2 dataTrees are already there.
             */
            if (!requiresEval) continue;

            set(contextTree, fullPropertyPath, evalPropertyValue);
            set(safeTree, fullPropertyPath, klona(evalPropertyValue));
            break;
          }
          case ENTITY_TYPE_VALUE.JSACTION: {
            const variableList =
              (entityConfig as JSActionEntityConfig).variables || [];
            if (variableList.indexOf(propertyPath) === -1) break;

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

            const skipVariableValueAssignment =
              !hasUnEvalValueModified && prevEvaluatedValue;

            const evalValue = skipVariableValueAssignment
              ? prevEvaluatedValue
              : evalPropertyValue;

            const evalPath = getEvalValuePath(fullPropertyPath, {
              isPopulated: true,
              //what is the purpose of this argument
              fullPath: true,
            });

            /** Variables defined in a JS object are not reactive.
             * Their evaluated values need to be reset only when the variable is modified by the user.
             * When uneval value of a js variable hasn't changed, it means that the previously evaluated values are in both trees already  */
            if (skipVariableValueAssignment) {
              setToEvalPathsIdenticalToState({
                evalPath,
                evalPathsIdenticalToState: this.evalPathsIdenticalToState,
                evalProps: this.evalProps,
                isParsedValueTheSame: true,
                fullPropertyPath,
                value: evalValue,
              });
            } else {
              const valueForSafeTree = klona(evalValue);
              setToEvalPathsIdenticalToState({
                evalPath,
                evalPathsIdenticalToState: this.evalPathsIdenticalToState,
                evalProps: this.evalProps,
                isParsedValueTheSame: true,
                fullPropertyPath,
                value: valueForSafeTree,
              });

              set(contextTree, fullPropertyPath, evalValue);
              set(safeTree, fullPropertyPath, valueForSafeTree);
              JSObjectCollection.setVariableValue(evalValue, fullPropertyPath);
              JSObjectCollection.setPrevUnEvalState({
                fullPath: fullPropertyPath,
                unEvalValue: unEvalPropertyValue,
              });
            }
            break;
          }
          default:
            set(contextTree, fullPropertyPath, evalPropertyValue);
            set(safeTree, fullPropertyPath, klona(evalPropertyValue));
        }
      }
    } catch (error) {
      staleMetaIds = [];
      this.errors.push({
        type: EvalErrorTypes.EVAL_TREE_ERROR,
        message: (error as Error).message,
      });
    } finally {
      // Restore the dataStore since it was a part of contextTree and prone to mutation.
      DataStore.replaceDataStore(dataStoreClone);

      // The below statement restores the execution context for async tasks are probably queued.
      setEvalContext({
        dataTree: contextTree,
        configTree: oldConfigTree,
        isDataField: false,
        isTriggerBased: true,
      });

      return {
        evaluatedTree: safeTree,
        contextTree: contextTree,
        evalMetaUpdates,
        staleMetaIds,
      };
    }
  }

  updateUndefinedEvalValuesMap(
    undefinedEvalValuesMap: Record<string, boolean>,
    evalPropertyValue: unknown,
    fullPropertyPath: string,
  ) {
    if (isUndefined(evalPropertyValue)) {
      undefinedEvalValuesMap[fullPropertyPath] = true;
    } else if (
      fullPropertyPath in undefinedEvalValuesMap &&
      !isUndefined(undefinedEvalValuesMap[fullPropertyPath])
    ) {
      delete undefinedEvalValuesMap[fullPropertyPath];
    }
  }

  setAllActionValidationConfig(allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  }): void {
    this.allActionValidationConfig = allActionValidationConfig;
  }

  sortDependencies(
    dependencyMap: DependencyMap,
    diffs?: DataTreeDiff[],
  ): Array<string> {
    const result = DependencyMapUtils.sortDependencies(dependencyMap);
    if (result.success) {
      return result.sortedDependencies;
    } else {
      const node = result.cyclicNode;
      let entityType = "UNKNOWN";
      const entityName = node.split(".")[0];
      const entity = get(this.oldUnEvalTree, entityName) as DataTreeEntity;
      const entityConfig = get(this.oldConfigTree, entityName);
      if (entity && isWidget(entity)) {
        entityType = entity.type;
      } else if (entity && isAction(entity)) {
        const actionEntityConfig = entityConfig as ActionEntityConfig;
        entityType = actionEntityConfig.pluginType;
      } else if (entity && isJSAction(entity)) {
        entityType = entity.ENTITY_TYPE;
      }
      const dependencies = dependencyMap.dependencies;

      // We are only interested in logging potential system-generated cyclic dependency errors to Sentry
      // If a cyclic dependency error occurs without a user editing a dynamic field, that is a potential system-generated cyclic dependency error

      const logToSentry = !diffs
        ? false
        : !diffs.some((val) => val.event === DataTreeDiffEvent.EDIT);
      this.errors.push({
        type: EvalErrorTypes.CYCLICAL_DEPENDENCY_ERROR,
        message: "Cyclic dependency found while evaluating.",
        context: {
          node,
          entityType,
          dependencyMap: dependencies,
          diffs,
          logToSentry,
        },
      });
      logError("CYCLICAL DEPENDENCY MAP", dependencies);
      this.hasCyclicalDependency = true;
      throw new CrashingError((result.error as Error).message);
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
          if (
            entity &&
            entityConfig &&
            !!propertyPath &&
            !propertyPath.includes("body")
          ) {
            ExecutionMetaData.setExecutionMetaData({
              triggerMeta: {
                source: {
                  id: getEntityId(entity) || "",
                  entityType: getEntityType(entity) || ENTITY_TYPE_VALUE.WIDGET,
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
              errors: errorModifier.addRootcauseToAsyncInvocationErrors(
                fullPropertyPath,
                configTree,
                evalErrors,
                this.dependencyMap,
              ),
              evalProps: this.evalProps,
              fullPropertyPath,
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
    configTree: ConfigTree,
    callbackData: Array<unknown>,
    context?: EvaluateContext,
  ) {
    const isDynamic = isDynamicValue(userScript);
    const { jsSnippets } = getDynamicBindings(userScript);

    return evaluateAsync(
      /**
       * jsSnippets[0] will be "" when a JS Object's function is run manually or when an empty action for a trigger field is configured.
       * Eg. Button1.onClick = "{{}}"
       * isDynamic will be false for JSObject's function run but will be true for action bindings.
       */
      isDynamic ? jsSnippets[0] : userScript,
      dataTree,
      configTree,
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

  getParsedValueForWidgetProperty({
    configTree,
    currentTree,
    entity,
    evalMetaUpdates,
    fullPropertyPath,
    isNewWidget,
    parsedValue,
    propertyPath,
    safeTree,
  }: {
    currentTree: DataTree;
    configTree: ConfigTree;
    entity: WidgetEntity;
    evalMetaUpdates: EvalMetaUpdates;
    fullPropertyPath: string;
    isNewWidget: boolean;
    parsedValue: unknown;
    propertyPath: string;
    safeTree?: DataTree;
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
      safeTree,
    });

    if (overwriteObj && overwriteObj.overwriteParsedValue) {
      parsedValue = overwriteObj.newValue;
    }

    return parsedValue;
  }

  // validates the user input saved as action property based on a validationConfig
  validateActionProperty(
    fullPropertyPath: string,
    action: ActionEntity,
    currentTree: DataTree,
    evalPropertyValue: any,
    unEvalPropertyValue: string,
    configTree: ConfigTree,
    validationConfig?: ValidationConfig,
  ) {
    if (!evalPropertyValue || isEmpty(validationConfig)) return;
    // runs VALIDATOR function and returns errors
    const { isValid, messages } = validateActionProperty(
      validationConfig,
      evalPropertyValue,
    );
    if (isValid) return;
    resetValidationErrorsForEntityProperty({
      evalProps: this.evalProps,
      fullPropertyPath,
    });
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
      configTree,
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
    removedPaths: Array<{ entityId: string; fullpath: string }>,
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
        if (!isEmpty(entityConfig.reactivePaths)) {
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
    }

    // If a nested property path has changed and someone (say x) is dependent on the parent of the said property,
    // x must also be evaluated. For example, the following relationship exists in dependency map:
    // <  "Input1.defaultText" : ["Table1.selectedRow.email"] >
    // If Table1.selectedRow has changed, then Input1.defaultText must also be evaluated because Table1.selectedRow.email
    // is a nested property of Table1.selectedRow
    const changePathsWithNestedDependants = addDependantsOfNestedPropertyPaths(
      Array.from(changePaths),
      this.inverseDependencies,
    );

    const trimmedChangedPaths = trimDependantChangePaths(
      changePathsWithNestedDependants,
      this.dependencies,
    );

    // Now that we have all the root nodes which have to be evaluated, recursively find all the other paths which
    // would get impacted because they are dependent on the said root nodes and add them in order
    const completeSortOrder = this.getCompleteSortOrder(
      trimmedChangedPaths,
      this.inverseDependencies,
    );

    // Remove any paths that do not exist in the data tree anymore
    return difference(
      completeSortOrder,
      removedPaths.map((removedPath) => removedPath.fullpath),
    );
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

    const dataTree = klona(this.evalTree);

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
        dataTree,
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
