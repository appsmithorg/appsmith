export * from "ce/components/editorComponents/Debugger/entityTypeLinkMap";

import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { moduleEditorURL } from "@appsmith/RouteBuilder";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { getCurrentModuleId } from "@appsmith/selectors/modulesSelector";
import { entityTypeLinkMap as CE_entityTypeLinkMap } from "ce/components/editorComponents/Debugger/entityTypeLinkMap";
import {
  DebuggerEntityLink,
  type EntityLinkProps,
} from "components/editorComponents/Debugger/DebuggerEntityLink";

export const entityTypeLinkMap = {
  ...CE_entityTypeLinkMap,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: ModuleInputsEntityLink,
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
        entityType: ENTITY_TYPE_VALUE.MODULE_INPUT,
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
