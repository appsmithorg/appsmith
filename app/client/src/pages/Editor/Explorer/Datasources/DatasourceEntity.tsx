import React, { useCallback } from "react";
import { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { getPluginIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import { ExplorerURLParams, getDatasourceIdFromURL } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import {
  fetchDatasourceStructure,
  saveDatasourceName,
} from "actions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { DatasourceStructureContainer } from "./DatasourceStructureContainer";

type ExplorerDatasourceEntityProps = {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
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

  const datasourceIdFromURL = getDatasourceIdFromURL();
  const active = datasourceIdFromURL === props.datasource.id;

  const updateDatasourceName = (id: string, name: string) =>
    saveDatasourceName({ id, name });

  const datasourceStructure = useSelector((state: AppState) => {
    return state.entities.datasources.structure[props.datasource.id];
  });

  const getDatasourceStructure = useCallback(() => {
    if (!datasourceStructure)
      dispatch(fetchDatasourceStructure(props.datasource.id));
  }, [datasourceStructure, props.datasource.id, dispatch]);

  return (
    <Entity
      entityId={props.datasource.id}
      className="datasource"
      key={props.datasource.id}
      icon={icon}
      name={props.datasource.name}
      active={active}
      step={props.step}
      searchKeyword={props.searchKeyword}
      action={switchDatasource}
      updateEntityName={updateDatasourceName}
      contextMenu={
        <DataSourceContextMenu
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
