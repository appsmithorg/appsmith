import React from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";
import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getDatasource } from "ee/selectors/entitiesSelector";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";

export default function DatasourceLink(props: EntityLinkProps) {
  const datasource = useSelector((state: DefaultRootState) =>
    getDatasource(state, props.id),
  );
  const basePageId = useSelector(getCurrentBasePageId);

  const onClick = () => {
    if (datasource) {
      history.push(
        datasourcesEditorIdURL({
          basePageId,
          datasourceId: datasource.id,
          params: getQueryParams(),
        }),
      );
      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: "DATASOURCE",
      });
    }
  };

  return (
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}
