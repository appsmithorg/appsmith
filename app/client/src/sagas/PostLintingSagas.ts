import { createMessage, JS_OBJECT_BODY_INVALID } from "ce/constants/messages";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
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
export function logLatestLintPropertyErrors(
  errors: LintErrors,
  dataTree: DataTree,
) {
  Object.keys(errors).forEach((path) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
    const entity = dataTree[entityName];
    // only log lint errors in JSObjects
    if (!isJSAction(entity)) return;
    const lintErrorInPath = errors[path];
    const lintErrorMessagesInPath = lintErrorInPath.map((error) => ({
      type: error.errorType,
      message: error.errorMessage,
    }));
    const debuggerKey = entity.actionId + propertyPath + "-lint";

    if (isEmpty(lintErrorInPath)) {
      AppsmithConsole.deleteError(debuggerKey);
    } else {
      AppsmithConsole.addError({
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
      });
    }
  });
}
