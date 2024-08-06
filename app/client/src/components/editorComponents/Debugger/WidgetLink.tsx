import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { navigateToEntity } from "actions/editorActions";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";

export default function WidgetLink(props: EntityLinkProps) {
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    dispatch(
      navigateToEntity({
        id: props.id,
        entityType: ENTITY_TYPE.WIDGET,
        propertyPath: props.propertyPath,
      }),
    );

    AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
      errorType: props.errorType,
      errorSubType: props.errorSubType,
      appsmithErrorCode: props.appsmithErrorCode,
      entityType: "WIDGET",
    });
  }, [
    props.id,
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
