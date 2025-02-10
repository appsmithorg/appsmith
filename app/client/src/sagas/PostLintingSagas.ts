import { Severity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import isEmpty from "lodash/isEmpty";
import AppsmithConsole from "utils/AppsmithConsole";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import isLintErrorLoggingEnabledForEntity from "ee/plugins/Linting/utils/isLintErrorLoggingEnabledForEntity";
import getEntityUniqueIdForLogs from "ee/plugins/Linting/utils/getEntityUniqueIdForLogs";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";

// We currently only log lint errors in JSObjects
export function* logLatestLintPropertyErrors({
  configTree,
  dataTree,
  errors,
}: {
  configTree: ConfigTree;
  dataTree: DataTree;
  errors: LintErrorsStore;
}) {
  const errorsToAdd = [];
  const errorsToRemove = [];

  for (const path of Object.keys(errors)) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
    const entity = dataTree[entityName];
    const config = configTree[entityName];

    // only log lint errors in JSObjects
    if (!isLintErrorLoggingEnabledForEntity(entity, propertyPath, config))
      continue;

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
          type: entity.ENTITY_TYPE as ENTITY_TYPE,
          propertyPath,
        },
      },
    });
  }

  AppsmithConsole.addErrors(errorsToAdd);
  AppsmithConsole.deleteErrors(errorsToRemove);
}
