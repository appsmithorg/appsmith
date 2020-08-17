import React, { useCallback } from "react";
import { Datasource } from "api/DatasourcesApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { queryIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import { ExplorerURLParams, getDatasourceIdFromURL } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import { useDispatch } from "react-redux";
import { updateDatasource } from "actions/datasourceActions";

type ExplorerDatasourceEntityProps = {
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
};
export const ExplorerDatasourceEntity = (
  props: ExplorerDatasourceEntityProps,
) => {
  const params = useParams<ExplorerURLParams>();
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

  const updateDatasourceName = useCallback(
    (id: string, name: string) => {
      return updateDatasource({ ...props.datasource, name: name }, active);
    },
    [props.datasource],
  );
  return (
    <Entity
      entityId={props.datasource.id}
      className="datasource"
      key={props.datasource.id}
      icon={queryIcon}
      name={props.datasource.name}
      active={active}
      step={props.step + 1}
      searchKeyword={props.searchKeyword}
      action={switchDatasource}
      updateEntityName={updateDatasourceName}
      contextMenu={
        <DataSourceContextMenu
          datasourceId={props.datasource.id}
          className={EntityClassNames.CONTEXT_MENU}
        />
      }
    />
  );
};

export default ExplorerDatasourceEntity;
