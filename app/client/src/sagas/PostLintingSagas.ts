import { Severity, type ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import isLintErrorLoggingEnabledForEntity from "@appsmith/plugins/Linting/utils/isLintErrorLoggingEnabledForEntity";
import getEntityUniqueIdForLogs from "@appsmith/plugins/Linting/utils/getEntityUniqueIdForLogs";

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
    if (!isLintErrorLoggingEnabledForEntity(entity)) continue;
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
    const uniqueId = getEntityUniqueIdForLogs(entity);

    const debuggerKey = uniqueId + propertyPath + "-lint";

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
          id: uniqueId,
          name: entityName,
          type: entity.ENTITY_TYPE as unknown as ENTITY_TYPE,
          propertyPath,
        },
      },
    });
  }

  AppsmithConsole.addErrors(errorsToAdd);
  AppsmithConsole.deleteErrors(errorsToRemove);
}
