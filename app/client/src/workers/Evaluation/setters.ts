import {
  getEntityNameAndPropertyPath,
  isWidget,
  overrideWidgetProperties,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "./evalTreeWithChanges";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./fns/utils/Messenger";
import { dataTreeEvaluator } from "./handlers/evalTree";
import { get, set } from "lodash";
import { validate } from "./validations";
import type {
  ConfigTree,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { getFnWithGuards, isAsyncGuard } from "./fns/utils/fnGuard";

class Setters {
  /** stores the setter accessor as key and true as value
   *
   * example - ```{ "Table1.setVisibility": true, "Table1.setData": true }```
   */
  private setterMethodLookup: Record<string, true> = {};

  private applySetterMethod(
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

    if (value === undefined) {
      const error = new Error("undefined value");
      error.name = entityName + "." + setterMethodName + " failed";
      throw error;
    }

    const { validationPaths } = entityConfig;

    if (validationPaths) {
      const validationConfig = validationPaths[propertyPath] || {};
      const config = { ...validationConfig };
     const config = { ...validationConfig, params: {...(config.params || {})} };
     config.params.strict = true;

      const { isValid, messages } = validate(
        config,
        value,
        entity as Record<string, unknown>,
        propertyPath,
      );
      if (!isValid) {
        const message = messages && messages[0] ? messages[0].message : "";
        const error = new Error(message);
        error.name = entityName + "." + setterMethodName + " failed";
        throw error;
      }
    }

    if (isWidget(entity)) {
      overrideWidgetProperties({
        entity,
        propertyPath,
        value,
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

        if (propPath.split(".")[0] === "meta") {
          const metaPropertyPath = propPath.split(".").slice(1);

          evalMetaUpdates.push({
            widgetId: entity.widgetId,
            metaPropertyPath,
            value,
          });

          WorkerMessenger.request({
            method: MAIN_THREAD_ACTION.SET_META_PROP_FROM_SETTER,
            data: { evalMetaUpdates },
          });
        }
      });
    }

    set(evalTree, path, value);
    set(self, path, value);

    return new Promise((resolve) => {
      updatedProperties.push([entityName, propertyPath]);
      evalTreeWithChanges(updatedProperties, resolve);
    });
  }
  /** Generates a new setter method */
  private factory(path: string, setterMethodName: string, entityName: string) {
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

  getEntitySettersFromConfig(
    entityConfig: DataTreeEntityConfig,
    entityName: string,
  ) {
    const setterMethodMap: Record<string, any> = {};
    if (!entityConfig) return setterMethodMap;

    if (entityConfig.__setters) {
      for (const setterMethodName of Object.keys(entityConfig.__setters)) {
        const path = entityConfig.__setters[setterMethodName].path;

        setterMethodMap[setterMethodName] = this.factory(
          path,
          setterMethodName,
          entityName,
        );
      }
    }

    return setterMethodMap;
  }

  init(configTree: ConfigTree) {
    const configTreeEntries = Object.entries(configTree);
    for (const [entityName, entityConfig] of configTreeEntries) {
      this.getEntitySettersFromConfig(entityConfig, entityName);
    }
  }
}

const setters = new Setters();
export default setters;
