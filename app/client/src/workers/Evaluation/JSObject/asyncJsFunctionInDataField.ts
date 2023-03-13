import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { difference, get } from "lodash";
import { DependencyMap, isChildPropertyPath } from "utils/DynamicBindingUtils";
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
  ) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    // Only datafields can cause updates
    if (!isDataField(fullPath, unEvalDataTree)) return [];

    const asyncJSFunctionsInvokedInPath = this.getAsyncJSFunctionInvocationsInPath(
      referencesInPath,
      unEvalDataTree,
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

  handlePathDeletion(deletedPath: string, unevalTree: DataTree) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      deletedPath,
    );
    const entity = unevalTree[entityName];
    if (
      isWidgetActionOrJsObject(entity) ||
      isATriggerPath(entity, propertyPath)
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
  ) {
    const updatedAsyncJSFunctionsInMap = new Set<string>();
    if (isDataField(editedPath, unevalTree)) {
      const asyncJSFunctionInvocationsInPath = this.getAsyncJSFunctionInvocationsInPath(
        dependenciesInPath,
        unevalTree,
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
    } else if (isJSFunction(unevalTree, editedPath)) {
      if (
        !isAsyncJSFunction(unevalTree, editedPath) &&
        Object.keys(this.asyncFunctionsInDataFieldsMap).includes(editedPath)
      ) {
        updatedAsyncJSFunctionsInMap.add(editedPath);
        delete this.asyncFunctionsInDataFieldsMap[editedPath];
      } else if (isAsyncJSFunction(unevalTree, editedPath)) {
        const boundFields = inverseDependencyMap[editedPath];
        let boundDataFields: string[] = [];
        if (boundFields) {
          boundDataFields = boundFields.filter((path) =>
            isDataField(path, unevalTree),
          );
          for (const dataFieldPath of boundDataFields) {
            const asyncJSFunctionInvocationsInPath = this.getAsyncJSFunctionInvocationsInPath(
              [editedPath],
              unevalTree,
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
    fullPath: string,
  ) {
    const asyncJSFunctions = new Set<string>();
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
    const entity = unEvalTree[entityName];
    const unevalPropValue = get(entity, propertyPath);

    dependencies.forEach((dependant) => {
      if (
        isAsyncJSFunction(unEvalTree, dependant) &&
        getFunctionInvocationRegex(dependant).test(unevalPropValue)
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
    delete this.asyncFunctionsInDataFieldsMap[funcName];
  }
}

export const asyncJsFunctionInDataFields = new AsyncJsFunctionInDataField();

export function getFunctionInvocationRegex(funcName: string) {
  return new RegExp(`${funcName}[.call | .apply]*\s*\\(.*?\\)`, "g");
}
