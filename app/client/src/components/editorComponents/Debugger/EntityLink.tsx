import { showDebugger } from "actions/debuggerActions";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { ENTITY_TYPE, SourceEntity } from "entities/AppsmithConsole";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import history from "utils/history";

const ActionLink = (props: EntityLinkProps) => {
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
      }
    }
  }, []);

  return (
    <Link
      name={props.name}
      onClick={onClick}
      entityType={props.type}
      uiComponent={props.uiComponent}
    />
  );
};

const WidgetLink = (props: EntityLinkProps) => {
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
  }, []);

  return (
    <Link
      name={props.name}
      onClick={onClick}
      entityType={props.type}
      uiComponent={props.uiComponent}
    />
  );
};

const DatasourceLink = (props: EntityLinkProps) => {
  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.id),
  );
  const pageId = useSelector(getCurrentPageId);
  const appId = useSelector(getCurrentApplicationId);

  const onClick = useCallback(() => {
    if (datasource) {
      history.push(DATA_SOURCES_EDITOR_ID_URL(appId, pageId, datasource.id));
    }
  }, []);

  return (
    <Link
      name={props.name}
      onClick={onClick}
      entityType={props.type}
      uiComponent={props.uiComponent}
    />
  );
};

const Link = (props: {
  name: string;
  onClick: any;
  entityType: ENTITY_TYPE;
  uiComponent: DebuggerLinkUI;
}) => {
  const dispatch = useDispatch();

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(showDebugger(false));
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
};

const EntityLink = (props: EntityLinkProps) => {
  switch (props.type) {
    case ENTITY_TYPE.WIDGET:
      return <WidgetLink {...props} />;
    case ENTITY_TYPE.ACTION:
      return <ActionLink {...props} />;
    case ENTITY_TYPE.DATASOURCE:
      return <DatasourceLink {...props} />;
    default:
      return null;
  }
};

type EntityLinkProps = {
  uiComponent: DebuggerLinkUI;
} & SourceEntity;

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

export default EntityLink;
