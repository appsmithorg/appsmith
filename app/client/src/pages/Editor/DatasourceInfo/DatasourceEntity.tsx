import React, { useCallback } from "react";

import { updateDatasourceName } from "actions/datasourceActions";
import type { Plugin } from "api/PluginApi";
import {
  datasourcesEditorIdURL,
  saasEditorDatasourceIdURL,
} from "ee/RouteBuilder";
import { getQueryIdFromURL } from "ee/pages/Editor/Explorer/helpers";
import type { AppState } from "ee/reducers";
import { getAction } from "ee/selectors/entitiesSelector";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { PluginType, isStoredDatasource } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import omit from "lodash/omit";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getQueryParams } from "utils/URLUtils";
import history, { NavigationMethod } from "utils/history";

import DataSourceContextMenu from "../Explorer/Datasources/DataSourceContextMenu";
import Entity, { EntityClassNames } from "../Explorer/Entity";
import { getPluginIcon } from "../Explorer/ExplorerIcons";

interface ExplorerDatasourceEntityProps {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  entityId: string;
  isActive: boolean;
  canManageDatasource?: boolean;
}

const ExplorerDatasourceEntity = React.memo(
  (props: ExplorerDatasourceEntityProps) => {
    const { entityId } = props;
    const icon = getPluginIcon(props.plugin);
    const location = useLocation();
    const switchDatasource = useCallback(() => {
      let url;
      if (props.plugin && props.plugin.type === PluginType.SAAS) {
        url = saasEditorDatasourceIdURL({
          basePageId: entityId,
          pluginPackageName: props.plugin.packageName,
          datasourceId: props.datasource.id,
          params: {
            viewMode: true,
          },
        });
      } else {
        url = datasourcesEditorIdURL({
          basePageId: entityId,
          datasourceId: props.datasource.id,
          params: omit(getQueryParams(), "viewMode"),
        });
      }

      AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
        type: "DATASOURCES",
        fromUrl: location.pathname,
        toUrl: url,
        name: props.datasource.name,
      });
      history.push(url, { invokedBy: NavigationMethod.EntityExplorer });
    }, [
      props.datasource.id,
      props.datasource.name,
      location.pathname,
      entityId,
    ]);

    const queryId = getQueryIdFromURL();
    const queryAction = useSelector((state: AppState) =>
      getAction(state, queryId || ""),
    );

    const updateDatasourceNameCall = (id: string, name: string) =>
      updateDatasourceName({ id: props.datasource.id, name });

    const expandDatasourceId = useSelector((state: AppState) => {
      return state.ui.datasourcePane.expandDatasourceId;
    });

    const nameTransformFn = useCallback(
      (input: string) => input.slice(0, 30),
      [],
    );

    let isDefaultExpanded = false;
    if (expandDatasourceId === props.datasource.id) {
      isDefaultExpanded = true;
    } else if (queryAction && isStoredDatasource(queryAction.datasource)) {
      isDefaultExpanded = queryAction.datasource.id === props.datasource.id;
    }

    return (
      <Entity
        action={switchDatasource}
        active={props.isActive}
        canEditEntityName={props.canManageDatasource}
        className="datasource"
        contextMenu={
          <DataSourceContextMenu
            className={EntityClassNames.CONTEXT_MENU}
            datasourceId={props.datasource.id}
            entityId={`${props.datasource.id}`}
          />
        }
        entityId={`${props.datasource.id}`}
        icon={icon}
        isDefaultExpanded={isDefaultExpanded}
        key={props.datasource.id}
        name={props.datasource.name}
        onNameEdit={nameTransformFn}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={updateDatasourceNameCall}
      />
    );
  },
);

ExplorerDatasourceEntity.displayName = "ExplorerDatasourceEntity";
export default ExplorerDatasourceEntity;
