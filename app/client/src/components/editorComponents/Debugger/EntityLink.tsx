import { PluginType } from "entities/Action";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getAction, getDatasource } from "@appsmith/selectors/entitiesSelector";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { datasourcesEditorIdURL } from "RouteBuilder";
import type LOG_TYPE from "entities/AppsmithConsole/logtype";
import { Link } from "design-system";
import type { Plugin } from "api/PluginApi";
import { navigateToEntity } from "actions/editorActions";

function ActionLink(props: EntityLinkProps) {
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

function JSCollectionLink(props: EntityLinkProps) {
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

function WidgetLink(props: EntityLinkProps) {
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
    <DebuggerEntityLink
      entityType={props.type}
      name={props.name}
      onClick={onClick}
      uiComponent={props.uiComponent}
    />
  );
}

function DebuggerEntityLink(props: {
  name: string;
  onClick: any;
  entityType: ENTITY_TYPE;
  uiComponent: DebuggerLinkUI;
}) {
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    props.onClick();
  };

  switch (props.uiComponent) {
    case DebuggerLinkUI.ENTITY_TYPE:
      return (
        <span className="debugger-entity">
          [
          <Link kind="secondary" onClick={onClick}>
            {props.name}
          </Link>
          ]
        </span>
      );
    case DebuggerLinkUI.ENTITY_NAME:
      return (
        <Link
          className="debugger-entity-link t--debugger-log-entity-link"
          onClick={onClick}
        >
          {props.name}
        </Link>
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
  plugin?: Plugin;
  errorType?: LOG_TYPE;
  errorSubType?: string;
  appsmithErrorCode?: string;
  message?: Message;
} & SourceEntity;

export enum DebuggerLinkUI {
  ENTITY_TYPE,
  ENTITY_NAME,
}

export default EntityLink;
