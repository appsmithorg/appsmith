import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";

export * from "ce/components/editorComponents/Debugger/entityTypeLinkMap";

import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import {
  moduleEditorURL,
  moduleInstanceEditorURL,
} from "@appsmith/RouteBuilder";
import { ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";
import { entityTypeLinkMap as CE_entityTypeLinkMap } from "ce/components/editorComponents/Debugger/entityTypeLinkMap";
import {
  DebuggerEntityLink,
  type EntityLinkProps,
} from "components/editorComponents/Debugger/DebuggerEntityLink";

export const entityTypeLinkMap = {
  ...CE_entityTypeLinkMap,
  [ENTITY_TYPE.MODULE_INPUT]: ModuleInputsEntityLink,
  [ENTITY_TYPE.MODULE_INSTANCE]: ModuleInstanceEntityLink,
};

function ModuleInputsEntityLink(props: EntityLinkProps) {
  const moduleId = useSelector(getCurrentModuleId);

  const onClick = useCallback(() => {
    if (moduleId) {
      history.push(moduleEditorURL({ moduleId }));
      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: ENTITY_TYPE.MODULE_INPUT,
      });
    }
  }, [moduleId]);

  return (
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function ModuleInstanceEntityLink(props: EntityLinkProps) {
  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, props.id),
  );
  const onClick = useCallback(() => {
    if (moduleInstance) {
      history.push(
        moduleInstanceEditorURL({
          moduleInstanceId: props.id,
          moduleType: moduleInstance.type,
        }),
      );
      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: ENTITY_TYPE.MODULE_INSTANCE,
      });
    }
  }, [props.id]);

  return (
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}
