import { PluginType } from "entities/Action";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { navigateToEntity } from "actions/editorActions";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";

export default function ActionLink(props: EntityLinkProps) {
  const action = useSelector((state: AppState) => getAction(state, props.id));
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    if (action) {
      dispatch(
        navigateToEntity({
          id: action.id,
          entityType: ENTITY_TYPE.ACTION,
          propertyPath: props.propertyPath,
        }),
      );
      const actionType = action.pluginType === PluginType.API ? "API" : "QUERY";

      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: actionType,
      });
    }
  }, [
    action,
    props.propertyPath,
    props.errorType,
    props.errorSubType,
    props.appsmithErrorCode,
  ]);

  return (
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}
