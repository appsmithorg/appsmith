import {
  createMessage,
  JS_OBJECT_BODY_INVALID,
} from "@appsmith/constants/messages";
import { ENTITY_TYPE, Severity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { isEmpty } from "lodash";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "workers/Evaluation/evaluationUtils";

// We currently only log lint errors in JSObjects
export function* logLatestLintPropertyErrors({
  dataTree,
  errors,
}: {
  errors: LintErrors;
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
        text: createMessage(JS_OBJECT_BODY_INVALID),
        messages: lintErrorMessagesInPath,
        source: {
          id: path,
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
