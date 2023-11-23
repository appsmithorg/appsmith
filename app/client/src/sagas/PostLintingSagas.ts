import { ENTITY_TYPE, Severity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";

// We currently only log lint errors in JSObjects
export function* logLatestLintPropertyErrors({
  dataTree,
  errors,
}: {
  errors: LintErrorsStore;
  dataTree: DataTree;
}) {
  const errorsToAdd = [];
  const errorsToRemove = [];

  for (const path of Object.keys(errors)) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
    const entity = dataTree[entityName];
    // only log lint errors in JSObjects
    if (!isJSAction(entity)) continue;
    // only log lint errors (not warnings)
    const lintErrorsInPath = errors[path].filter(
      (error) => error.severity === Severity.ERROR,
    );
    const lintErrorMessagesInPath = lintErrorsInPath.map((error) => ({
      type: error.errorType,
      message: error.errorMessage,
      lineNumber: error.line,
      character: error.ch,
    }));
    const debuggerKey = entity.actionId + propertyPath + "-lint";

    if (isEmpty(lintErrorsInPath)) {
      errorsToRemove.push({ id: debuggerKey });
      continue;
    }

    errorsToAdd.push({
      payload: {
        id: debuggerKey,
        logType: LOG_TYPE.LINT_ERROR,
        text: "LINT ERROR",
        messages: lintErrorMessagesInPath,
        source: {
          id: entity.actionId,
          name: entityName,
          type: ENTITY_TYPE.JSACTION,
          propertyPath,
        },
      },
    });
  }

  AppsmithConsole.addErrors(errorsToAdd);
  AppsmithConsole.deleteErrors(errorsToRemove);
}
