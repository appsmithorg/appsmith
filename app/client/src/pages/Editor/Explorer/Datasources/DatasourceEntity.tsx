import React, { useCallback } from "react";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { getPluginIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import {
  ExplorerURLParams,
  getDatasourceIdFromURL,
  getQueryIdFromURL,
} from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import {
  fetchDatasourceStructure,
  saveDatasourceName,
  expandDatasourceEntity,
} from "actions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { DatasourceStructureContainer } from "./DatasourceStructureContainer";
import { getAction } from "selectors/entitiesSelector";
import { isStoredDatasource } from "entities/Action";

type ExplorerDatasourceEntityProps = {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  pageId: string;
};

export const ExplorerDatasourceEntity = (
  props: ExplorerDatasourceEntityProps,
) => {
  const params = useParams<ExplorerURLParams>();
  const dispatch = useDispatch();
  const icon = getPluginIcon(props.plugin);
  const switchDatasource = useCallback(
    () =>
      history.push(
        DATA_SOURCES_EDITOR_ID_URL(
          params.applicationId,
          params.pageId,
          props.datasource.id,
        ),
      ),
    [params.applicationId, params.pageId, props.datasource.id],
  );

  const queryId = getQueryIdFromURL();
  const queryAction = useSelector((state: AppState) =>
    getAction(state, queryId || ""),
  );

  const datasourceIdFromURL = getDatasourceIdFromURL();
  const active = datasourceIdFromURL === props.datasource.id;

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

  let isDefaultExpanded = false;
  if (expandDatasourceId === props.datasource.id) {
    isDefaultExpanded = true;
  } else if (queryAction && isStoredDatasource(queryAction.datasource)) {
    isDefaultExpanded = queryAction.datasource.id === props.datasource.id;
  }

  return (
    <Entity
      entityId={`${props.datasource.id}-${props.pageId}`}
      className="datasource"
      key={props.datasource.id}
      icon={icon}
      name={props.datasource.name}
      active={active}
      step={props.step}
      searchKeyword={props.searchKeyword}
      isDefaultExpanded={isDefaultExpanded}
      action={switchDatasource}
      updateEntityName={updateDatasourceName}
      contextMenu={
        <DataSourceContextMenu
          entityId={`${props.datasource.id}-${props.pageId}`}
          datasourceId={props.datasource.id}
          className={EntityClassNames.CONTEXT_MENU}
        />
      }
      onToggle={getDatasourceStructure}
    >
      <DatasourceStructureContainer
        datasourceStructure={datasourceStructure}
        datasourceId={props.datasource.id}
        step={props.step}
      />
    </Entity>
  );
};
export default ExplorerDatasourceEntity;
