import { ENTITY_TYPE as AppsmithconsoleEntityType } from "entities/AppsmithConsole";
import { Severity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  getEntityNameAndPropertyPath,
  isAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import { getEntityId } from "utils/DynamicBindingUtils";
import {
  ACTION_TYPE,
  JSACTION_TYPE,
  WIDGET_TYPE,
} from "@appsmith/entities/DataTree/types";
import { isWidgetActionOrJsObject } from "@appsmith/entities/DataTree/utils";

function getAppsmithConsoleEntityType(entity: DataTreeEntity) {
  switch (entity.ENTITY_TYPE) {
    case JSACTION_TYPE: {
      return AppsmithconsoleEntityType.JSACTION;
    }
    case ACTION_TYPE: {
      return AppsmithconsoleEntityType.ACTION;
    }
    case WIDGET_TYPE: {
      return AppsmithconsoleEntityType.WIDGET;
    }
  }
}

// We currently only log lint errors in JSObjects
export function* logLatestLintPropertyErrors({
  configTree,
  dataTree,
  errors,
}: {
  errors: LintErrorsStore;
  dataTree: DataTree;
  configTree: ConfigTree;
}) {
  const errorsToAdd = [];
  const errorsToRemove = [];

  for (const path of Object.keys(errors)) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
    const entity = dataTree[entityName];
    const entityConfig = configTree[entityName];
    if (!isWidgetActionOrJsObject(entity)) continue;
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

    const id = getEntityId(entity);
    const entityType = getAppsmithConsoleEntityType(entity);
    if (!id || !entityType) continue;
    const pluginTypeField = isAction(entity)
      ? entityConfig.pluginType
      : entity.type;
    const debuggerKey = id + propertyPath + "-lint";

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
          id,
          name: entityName,
          type: entityType,
          propertyPath,
          pluginType: pluginTypeField,
        },
      },
    });
  }

  AppsmithConsole.addErrors(errorsToAdd);
  AppsmithConsole.deleteErrors(errorsToRemove);
}
