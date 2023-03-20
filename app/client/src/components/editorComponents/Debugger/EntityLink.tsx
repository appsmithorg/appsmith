import { PluginType } from "entities/Action";
import type { SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getAction,
  getAllWidgetsMap,
  getDatasource,
} from "selectors/entitiesSelector";
import { getLastSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history, { NavigationMethod } from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { datasourcesEditorIdURL, jsCollectionIdURL } from "RouteBuilder";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";

function ActionLink(props: EntityLinkProps) {
  const applicationId = useSelector(getCurrentApplicationId);
  const action = useSelector((state: AppState) => getAction(state, props.id));

  const onClick = useCallback(() => {
    if (action) {
      const { id, pageId, pluginType } = action;
      const actionConfig = getActionConfig(pluginType);
      const url = applicationId && actionConfig?.getURL(pageId, id, pluginType);
      if (!url) return;
      history.push(url);
      const actionType = action.pluginType === PluginType.API ? "API" : "QUERY";

      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
        errorType: props.errorType,
        errorSubType: props.errorSubType,
        appsmithErrorCode: props.appsmithErrorCode,
        entityType: actionType,
      });
    }
  }, [action]);

  return (
    <Link
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function JSCollectionLink(props: EntityLinkProps) {
  const pageId = useSelector(getCurrentPageId);
  const onClick = useCallback(() => {
    if (props.id) {
      const url = jsCollectionIdURL({
        pageId,
        collectionId: props.id,
      });

      if (url) {
        history.push(url);
        AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
          errorType: props.errorType,
          errorSubType: props.errorSubType,
          appsmithErrorCode: props.appsmithErrorCode,
          entityType: "JSACTION",
        });
      }
    }
  }, []);
  return (
    <Link
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function WidgetLink(props: EntityLinkProps) {
  const widgetMap = useSelector(getAllWidgetsMap);
  const selectedWidgetId = useSelector(getLastSelectedWidget);
  const { navigateToWidget } = useNavigateToWidget();

  const onClick = useCallback(() => {
    const widget = widgetMap[props.id];
    if (!widget) return;

    navigateToWidget(
      props.id,
      widget.type,
      widget.pageId,
      NavigationMethod.EntityExplorer,
      props.id === selectedWidgetId,
    );
    AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
      errorType: props.errorType,
      errorSubType: props.errorSubType,
      appsmithErrorCode: props.appsmithErrorCode,
      entityType: "WIDGET",
    });
  }, [navigateToWidget]);

  return (
    <Link
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function DatasourceLink(props: EntityLinkProps) {
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
    <Link
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function Link(props: {
  name: string;
  onClick: any;
  entityType: ENTITY_TYPE;
  uiComponent: DebuggerLinkUI;
}) {
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    props.onClick();
  };

  switch (props.uiComponent) {
    case DebuggerLinkUI.ENTITY_TYPE:
      return (
        <span className="debugger-entity">
          [<span onClick={onClick}>{props.name}</span>]
        </span>
      );
    case DebuggerLinkUI.ENTITY_NAME:
      const link = props.name;
      return (
        <span
          className="debugger-entity-link t--debugger-log-entity-link"
          onClick={onClick}
        >
          {link}
        </span>
      );
    default:
      return null;
  }
}

const entityTypeLinkMap = {
  [ENTITY_TYPE.WIDGET]: WidgetLink,
  [ENTITY_TYPE.ACTION]: ActionLink,
  [ENTITY_TYPE.DATASOURCE]: DatasourceLink,
  [ENTITY_TYPE.JSACTION]: JSCollectionLink,
};

function EntityLink(props: EntityLinkProps) {
  const Component = entityTypeLinkMap[props.type];
  return <Component {...props} />;
}

type EntityLinkProps = {
  uiComponent: DebuggerLinkUI;
  errorType?: LOG_TYPE;
  errorSubType?: string;
  appsmithErrorCode?: string;
} & SourceEntity;

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

export default EntityLink;
