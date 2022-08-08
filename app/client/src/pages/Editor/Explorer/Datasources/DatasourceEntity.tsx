import React, { useCallback } from "react";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { getPluginIcon } from "../ExplorerIcons";
import { getQueryIdFromURL } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import history from "utils/history";
import {
  fetchDatasourceStructure,
  saveDatasourceName,
  expandDatasourceEntity,
  setDatsourceEditorMode,
} from "actions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { DatasourceStructureContainer } from "./DatasourceStructureContainer";
import { isStoredDatasource, PluginType } from "entities/Action";
import { getQueryParams } from "utils/URLUtils";
import { getAction } from "selectors/entitiesSelector";
import {
  datasourcesEditorIdURL,
  saasEditorDatasourceIdURL,
} from "RouteBuilder";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";

type ExplorerDatasourceEntityProps = {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  pageId: string;
  isActive: boolean;
};

const ExplorerDatasourceEntity = React.memo(
  (props: ExplorerDatasourceEntityProps) => {
    const guidedTourEnabled = useSelector(inGuidedTour);
    const dispatch = useDispatch();
    const pageId = useSelector(getCurrentPageId);
    const icon = getPluginIcon(props.plugin);
    const location = useLocation();
    const switchDatasource = useCallback(() => {
      let url;
      if (props.plugin && props.plugin.type === PluginType.SAAS) {
        url = saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName: props.plugin.packageName,
          datasourceId: props.datasource.id,
          params: {
            viewMode: true,
          },
        });
      } else {
        dispatch(
          setDatsourceEditorMode({ id: props.datasource.id, viewMode: true }),
        );
        url = datasourcesEditorIdURL({
          pageId,
          datasourceId: props.datasource.id,
          params: getQueryParams(),
        });
      }

      AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
        type: "DATASOURCES",
        fromUrl: location.pathname,
        toUrl: url,
        name: props.datasource.name,
      });
      history.push(url);
    }, [props.datasource.id, props.datasource.name, location.pathname]);

    const queryId = getQueryIdFromURL();
    const queryAction = useSelector((state: AppState) =>
      getAction(state, queryId || ""),
    );

    const updateDatasourceName = (id: string, name: string) =>
      saveDatasourceName({ id: props.datasource.id, name });

    const datasourceStructure = useSelector((state: AppState) => {
      return state.entities.datasources.structure[props.datasource.id];
    });

    const expandDatasourceId = useSelector((state: AppState) => {
      return state.ui.datasourcePane.expandDatasourceId;
    });

    const getDatasourceStructure = useCallback(
      (isOpen) => {
        if (!datasourceStructure && isOpen) {
          dispatch(fetchDatasourceStructure(props.datasource.id));
        }

        dispatch(expandDatasourceEntity(isOpen ? props.datasource.id : ""));
      },
      [datasourceStructure, props.datasource.id, dispatch],
    );

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
    // In guided tour we want the datasource structure to be shown only when expanded
    if (guidedTourEnabled) {
      isDefaultExpanded = false;
    }

    return (
      <Entity
        action={switchDatasource}
        active={props.isActive}
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
        onToggle={getDatasourceStructure}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={updateDatasourceName}
      >
        <DatasourceStructureContainer
          datasourceId={props.datasource.id}
          datasourceStructure={datasourceStructure}
          step={props.step}
        />
      </Entity>
    );
  },
);

ExplorerDatasourceEntity.displayName = "ExplorerDatasourceEntity";
export default ExplorerDatasourceEntity;
