import {
  getEntityNameAndPropertyPath,
  isWidget,
  overrideWidgetProperties,
} from "ee/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "./evalTreeWithChanges";
import { dataTreeEvaluator } from "./handlers/evalTree";
import { get, set } from "lodash";
import { validate } from "./validations";
import type {
  DataTreeEntityConfig,
  WidgetEntity,
} from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import { getFnWithGuards, isAsyncGuard } from "./fns/utils/fnGuard";
import { shouldAddSetter } from "./evaluate";
import { EVAL_WORKER_SYNC_ACTION } from "ee/workers/Evaluation/evalWorkerActions";

class Setters {
  /** stores the setter method accessor as key and true as value
   *
   * example - ```{ "Table1.setVisibility": true, "Table1.setData": true }```
   */
  private setterMethodLookup: Record<string, true> = {};
  /** stores the setter property accessor as key and setter method name as value
   *
   * example - ```{ "Table1.tableData": "Table1.setData" }```
   */
  private setterAccessorMap: Record<string, string> = {};

  private async applySetterMethod(
    path: string,
    value: unknown,
    setterMethodName: string,
  ) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);

    if (!dataTreeEvaluator) return;

    const evalTree = dataTreeEvaluator.getEvalTree();
    const configTree = dataTreeEvaluator.getConfigTree();

    const entity = evalTree[entityName];
    const entityConfig = configTree[entityName];

    const updatedProperties: string[][] = [];
    const overriddenProperties: string[] = [];
    const evalMetaUpdates: EvalMetaUpdates = [];

    let parsedValue = value;

    if (value === undefined) {
      const error = new Error(
        `The value passed to ${entityName}.${setterMethodName}() evaluates to undefined.`,
      );

      error.name = entityName + "." + setterMethodName + " failed";
      throw error;
    }

    const { validationPaths } = entityConfig;

    if (validationPaths) {
      const validationConfig = validationPaths[propertyPath] || {};

      const config = {
        ...validationConfig,
        params: { ...(validationConfig.params || {}) },
      };

      config.params.strict = true;

      const { isValid, messages, parsed } = validate(
        config,
        value,
        entity as Record<string, unknown>,
        propertyPath,
      );

      parsedValue = parsed;

      if (!isValid) {
        const message = messages && messages[0] ? messages[0].message : "";
        const error = new Error(
          `${entityName + "." + setterMethodName}: ${message}`,
        );

        error.name = entityName + "." + setterMethodName + " failed";
        throw error;
      }
    }

    if (isWidget(entity)) {
      overrideWidgetProperties({
        entity: entity,
        propertyPath,
        value: parsedValue,
        currentTree: evalTree,
        configTree,
        evalMetaUpdates,
        fullPropertyPath: path,
        isNewWidget: false,
        shouldUpdateGlobalContext: true,
        overriddenProperties,
      });

      overriddenProperties.forEach((propPath) => {
        updatedProperties.push([entityName, propPath]);
      });
    }

    set(evalTree, path, parsedValue);
    set(self, path, parsedValue);

    /**
     * Making the update to dataTree async as there could be queue microtask updates that need to execute before this update.
     * Issue:- https://github.com/appsmithorg/appsmith/issues/25364
     */
    return new Promise((resolve) => {
      resolve(parsedValue);
    }).then((res) => {
      updatedProperties.push([entityName, propertyPath]);

      evalTreeWithChanges({
        data: {
          updatedValuePaths: updatedProperties,
          metaUpdates: evalMetaUpdates,
        },
        method: EVAL_WORKER_SYNC_ACTION.EVAL_TREE_WITH_CHANGES,
        webworkerTelemetry: {},
      });

      return res;
    });
  }
  /** Generates a new setter method */
  private createSetter(
    path: string,
    setterMethodName: string,
    entityName: string,
  ) {
    /** register the setter method in the lookup */
    set(this.setterMethodLookup, [entityName, setterMethodName], true);

    const fn = async (value: unknown) => {
      if (!dataTreeEvaluator) return;

      return this.applySetterMethod(path, value, setterMethodName);
    };

    return getFnWithGuards(fn, setterMethodName, [isAsyncGuard]);
  }

  clear() {
    this.setterMethodLookup = {};
  }

  has(entityName: string, propertyName: string) {
    return get(this.setterMethodLookup, [entityName, propertyName], false);
  }

  getMap() {
    return this.setterMethodLookup;
  }

  getSetterAccessorMap() {
    return this.setterAccessorMap;
  }

  getEntitySettersFromConfig(
    entityConfig: DataTreeEntityConfig,
    entityName: string,
    entity: DataTreeEntity,
  ) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setterMethodMap: Record<string, any> = {};

    if (!entityConfig) return setterMethodMap;

    if (entityConfig.__setters) {
      for (const setterMethodName of Object.keys(entityConfig.__setters)) {
        const pathToSet = entityConfig.__setters[setterMethodName].path;

        if (!shouldAddSetter(entityConfig.__setters[setterMethodName], entity))
          continue;

        this.setterAccessorMap[pathToSet] = `${entityName}.${setterMethodName}`;

        setterMethodMap[setterMethodName] = this.createSetter(
          pathToSet,
          setterMethodName,
          entityName,
        );
      }
    }

    return setterMethodMap;
  }

  init(configTree: ConfigTree, dataTree: DataTree) {
    const configTreeEntries = Object.entries(configTree);

    for (const [entityName, entityConfig] of configTreeEntries) {
      const entity = dataTree[entityName];

      this.getEntitySettersFromConfig(entityConfig, entityName, entity);
    }
  }
}

const setters = new Setters();

export default setters;
