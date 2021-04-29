import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { PluginType } from "entities/Action";
import { ENTITY_TYPE, SourceEntity } from "entities/AppsmithConsole";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getAction,
  getAllWidgetsMap,
  getDatasource,
} from "selectors/entitiesSelector";
import { getSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";

function ActionLink(props: EntityLinkProps) {
  const applicationId = useSelector(getCurrentApplicationId);
  const action = useSelector((state: AppState) => getAction(state, props.id));

  const onClick = useCallback(() => {
    if (action) {
      const { pageId, pluginType, id } = action;
      const actionConfig = getActionConfig(pluginType);
      const url =
        applicationId && actionConfig?.getURL(applicationId, pageId, id);

      if (url) {
        history.push(url);
        const actionType =
          action.pluginType === PluginType.API ? "API" : "QUERY";

        AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
          entityType: actionType,
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
  const selectedWidgetId = useSelector(getSelectedWidget);
  const { navigateToWidget } = useNavigateToWidget();

  const onClick = useCallback(() => {
    const widget = widgetMap[props.id];
    if (!widget) return;

    navigateToWidget(
      props.id,
      widget.type,
      widget.pageId,
      props.id === selectedWidgetId,
      widget.parentModalId,
    );
    AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
      entityType: "WIDGET",
    });
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

function DatasourceLink(props: EntityLinkProps) {
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.id),
  );
  const pageId = useSelector(getCurrentPageId);
  const appId = useSelector(getCurrentApplicationId);

  const onClick = () => {
    if (datasource) {
      history.push(DATA_SOURCES_EDITOR_ID_URL(appId, pageId, datasource.id));
      AnalyticsUtil.logEvent("DEBUGGER_ENTITY_NAVIGATION", {
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
      return (
        <span className="debugger-entity-link" onClick={onClick}>
          {props.name}.{props.entityType.toLowerCase()}
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
};

function EntityLink(props: EntityLinkProps) {
  const Component = entityTypeLinkMap[props.type];
  return <Component {...props} />;
}

type EntityLinkProps = {
  uiComponent: DebuggerLinkUI;
} & SourceEntity;

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

export default EntityLink;
