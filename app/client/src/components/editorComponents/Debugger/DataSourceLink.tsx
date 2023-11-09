import React from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DebuggerEntityLink, type EntityLinkProps } from "./DebuggerEntityLink";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getDatasource } from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { datasourcesEditorIdURL } from "@appsmith/RouteBuilder";

export default function DatasourceLink(props: EntityLinkProps) {
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.id),
  );
  const pageId = useSelector(getCurrentPageId);

  const onClick = () => {
    if (datasource) {
      history.push(
        datasourcesEditorIdURL({
          pageId,
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
