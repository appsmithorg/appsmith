import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { difference, get } from "lodash";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { isChildPropertyPath } from "utils/DynamicBindingUtils";
import {
  isDataField,
  isWidgetActionOrJsObject,
} from "workers/common/DataTreeEvaluator/utils";
import {
  isAsyncJSFunction,
  isJSFunction,
  updateMap,
} from "workers/common/DependencyMap/utils";

class AsyncJsFunctionInDataField {
  private asyncFunctionsInDataFieldsMap: DependencyMap = {};

  update(
    fullPath: string,
    referencesInPath: string[],
    unEvalDataTree: DataTree,
    configTree: ConfigTree,
  ) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    // Only datafields can cause updates
    if (!isDataField(fullPath, configTree)) return [];

    const asyncJSFunctionsInvokedInPath =
      this.getAsyncJSFunctionInvocationsInPath(
        referencesInPath,
        unEvalDataTree,
        configTree,
        fullPath,
      );

    for (const asyncJSFunc of asyncJSFunctionsInvokedInPath) {
      updatedAsyncJSFunctionsInMap.add(asyncJSFunc);
      updateMap(this.asyncFunctionsInDataFieldsMap, asyncJSFunc, [fullPath], {
        deleteOnEmpty: true,
      });
    }
    return Array.from(updatedAsyncJSFunctionsInMap);
  }

  handlePathDeletion(
    deletedPath: string,
    unevalTree: DataTree,
    configTree: ConfigTree,
  ) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(deletedPath);
    const entity = unevalTree[entityName];
    const entityConfig = configTree[entityName];
    if (
      isWidgetActionOrJsObject(entity) ||
      isATriggerPath(entityConfig, propertyPath)
    )
      return [];

    Object.keys(this.asyncFunctionsInDataFieldsMap).forEach((asyncFuncName) => {
      if (isChildPropertyPath(deletedPath, asyncFuncName)) {
        this.deleteFunctionFromMap(asyncFuncName);
      } else {
        const toRemove: string[] = [];
        this.asyncFunctionsInDataFieldsMap[asyncFuncName].forEach(
          (dependantPath) => {
            if (isChildPropertyPath(deletedPath, dependantPath)) {
              updatedAsyncJSFunctionsInMap.add(asyncFuncName);
              toRemove.push(dependantPath);
            }
          },
        );
        const newAsyncFunctiondependents = difference(
          this.asyncFunctionsInDataFieldsMap[asyncFuncName],
          toRemove,
        );
        updateMap(
          this.asyncFunctionsInDataFieldsMap,
          asyncFuncName,
          newAsyncFunctiondependents,
          { replaceValue: true, deleteOnEmpty: true },
        );
      }
    });
    return Array.from(updatedAsyncJSFunctionsInMap);
  }
  handlePathEdit(
    editedPath: string,
    dependenciesInPath: string[],
    unevalTree: DataTree,
    inverseDependencyMap: DependencyMap,
    configTree: ConfigTree,
  ) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    if (isDataField(editedPath, configTree)) {
      const asyncJSFunctionInvocationsInPath =
        this.getAsyncJSFunctionInvocationsInPath(
          dependenciesInPath,
          unevalTree,
          configTree,
          editedPath,
        );
      asyncJSFunctionInvocationsInPath.forEach((funcName) => {
        updatedAsyncJSFunctionsInMap.add(funcName);
        updateMap(this.asyncFunctionsInDataFieldsMap, funcName, [editedPath], {
          deleteOnEmpty: true,
        });
      });

      Object.keys(this.asyncFunctionsInDataFieldsMap).forEach(
        (asyncFuncName) => {
          const toRemove: string[] = [];
          this.asyncFunctionsInDataFieldsMap[asyncFuncName].forEach(
            (dependantPath) => {
              if (
                editedPath === dependantPath &&
                !asyncJSFunctionInvocationsInPath.includes(asyncFuncName)
              ) {
                updatedAsyncJSFunctionsInMap.add(asyncFuncName);
                toRemove.push(dependantPath);
              }
            },
          );
          const newAsyncFunctiondependents = difference(
            this.asyncFunctionsInDataFieldsMap[asyncFuncName],
            toRemove,
          );
          updateMap(
            this.asyncFunctionsInDataFieldsMap,
            asyncFuncName,
            newAsyncFunctiondependents,
            { replaceValue: true, deleteOnEmpty: true },
          );
        },
      );
    } else if (isJSFunction(configTree, editedPath)) {
      if (
        !isAsyncJSFunction(configTree, editedPath) &&
        Object.keys(this.asyncFunctionsInDataFieldsMap).includes(editedPath)
      ) {
        updatedAsyncJSFunctionsInMap.add(editedPath);
        delete this.asyncFunctionsInDataFieldsMap[editedPath];
      } else if (isAsyncJSFunction(configTree, editedPath)) {
        const boundFields = inverseDependencyMap[editedPath];
        let boundDataFields: string[] = [];
        if (boundFields) {
          boundDataFields = boundFields.filter((path) =>
            isDataField(path, configTree),
          );
          for (const dataFieldPath of boundDataFields) {
            const asyncJSFunctionInvocationsInPath =
              this.getAsyncJSFunctionInvocationsInPath(
                [editedPath],
                unevalTree,
                configTree,
                dataFieldPath,
              );
            if (asyncJSFunctionInvocationsInPath) {
              updatedAsyncJSFunctionsInMap.add(editedPath);
              updateMap(
                this.asyncFunctionsInDataFieldsMap,
                editedPath,
                [dataFieldPath],
                { deleteOnEmpty: true },
              );
            }
          }
        }
      }
    }
    return Array.from(updatedAsyncJSFunctionsInMap);
  }

  getAsyncJSFunctionInvocationsInPath(
    dependencies: string[],
    unEvalTree: DataTree,
    configTree: ConfigTree,
    fullPath: string,
  ) {
    const asyncJSFunctions = new Set<string>();
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const entity = unEvalTree[entityName];
    const unevalPropValue = get(entity, propertyPath);

    dependencies.forEach((dependant) => {
      if (
        isAsyncJSFunction(configTree, dependant) &&
        this.getFunctionInvocationRegex(dependant).test(unevalPropValue)
      ) {
        asyncJSFunctions.add(dependant);
      }
    });

    return Array.from(asyncJSFunctions);
  }
  getMap() {
    return this.asyncFunctionsInDataFieldsMap;
  }
  deleteFunctionFromMap(funcName: string) {
    this.asyncFunctionsInDataFieldsMap[funcName] &&
      delete this.asyncFunctionsInDataFieldsMap[funcName];
  }
  getAsyncFunctionBindingInDataField(fullPath: string): string | undefined {
    let hasAsyncFunctionInvocation: string | undefined = undefined;
    Object.keys(this.asyncFunctionsInDataFieldsMap).forEach((path) => {
      if (this.asyncFunctionsInDataFieldsMap[path].includes(fullPath)) {
        return (hasAsyncFunctionInvocation = path);
      }
    });
    return hasAsyncFunctionInvocation;
  }
  getFunctionInvocationRegex(funcName: string) {
    return new RegExp(`${funcName}[.call | .apply]*\s*\\(.*?\\)`, "g");
  }
  clearMap() {
    this.asyncFunctionsInDataFieldsMap = {};
  }
}

export const asyncJsFunctionInDataFields = new AsyncJsFunctionInDataField();
