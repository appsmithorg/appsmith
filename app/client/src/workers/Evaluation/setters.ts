import {
  getEntityNameAndPropertyPath,
  isWidget,
  overrideWidgetProperties,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { evalTreeWithChanges } from "./evalTreeWithChanges";
import { dataTreeEvaluator } from "./handlers/evalTree";
import { get, set } from "lodash";
import { validate } from "./validations";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { getFnWithGuards, isAsyncGuard } from "./fns/utils/fnGuard";
import { shouldAddSetter } from "./evaluate";

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
        entity,
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

    return new Promise((resolve) => {
      updatedProperties.push([entityName, propertyPath]);
      evalTreeWithChanges(updatedProperties, evalMetaUpdates);
      resolve(parsedValue);
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
    entity: DataTreeEntity,
  ) {
    const setterMethodMap: Record<string, any> = {};
    if (!entityConfig) return setterMethodMap;

    if (entityConfig.__setters) {
      for (const setterMethodName of Object.keys(entityConfig.__setters)) {
        const path = entityConfig.__setters[setterMethodName].path;

        if (!shouldAddSetter(entityConfig.__setters[setterMethodName], entity))
          continue;

        setterMethodMap[setterMethodName] = this.factory(
          path,
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
