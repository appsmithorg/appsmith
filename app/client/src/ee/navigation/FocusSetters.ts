export * from "ce/navigation/FocusSetters";

import {
  setSelectedJSObject as CE_setSelectedJSObject,
  setSelectedQuery as CE_setSelectedQuery,
} from "../../ce/navigation/FocusSetters";

import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const setSelectedJSObject = (focusInfo: FocusEntityInfo) => {
  if (focusInfo.entity === FocusEntity.JS_MODULE_INSTANCE) {
    history.replace(
      moduleInstanceEditorURL({
        moduleType: MODULE_TYPE.JS,
        moduleInstanceId: focusInfo.id,
      }),
      {
        invokedBy: NavigationMethod.ContextSwitching,
      },
    );
  } else {
    CE_setSelectedJSObject(focusInfo);
  }
};

export const setSelectedQuery = (focusInfo: FocusEntityInfo) => {
  if (focusInfo.entity === FocusEntity.QUERY_MODULE_INSTANCE) {
    history.replace(
      moduleInstanceEditorURL({
        moduleType: MODULE_TYPE.QUERY,
        moduleInstanceId: focusInfo.id,
      }),
      {
        invokedBy: NavigationMethod.ContextSwitching,
      },
    );
  } else {
    CE_setSelectedQuery(focusInfo);
  }
};
