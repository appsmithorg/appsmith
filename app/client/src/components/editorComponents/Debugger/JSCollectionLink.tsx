import React, { useDispatch } from "react-redux";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";
import { useCallback } from "react";
import { navigateToEntity } from "actions/editorActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";

export default function JSCollectionLink(props: EntityLinkProps) {
  const dispatch = useDispatch();
  let position: { ch: number; line: number } | undefined;
  if (props.message) {
    if (props.message.character && props.message.lineNumber) {
      position = {
        ch: props.message.character,
        line: props.message.lineNumber,
      };
    }
  }
  const onClick = useCallback(() => {
    if (props.id) {
      dispatch(
        navigateToEntity({
          id: props.id,
          entityType: ENTITY_TYPE.JSACTION,
          propertyPath: props.propertyPath,
          position,
        }),
      );

      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: "JSACTION",
      });
    }
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
