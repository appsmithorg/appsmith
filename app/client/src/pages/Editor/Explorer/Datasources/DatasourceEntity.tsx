import React from "react";
import { Datasource } from "api/DatasourcesApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { queryIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";

type ExplorerDatasourceEntityProps = {
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
};
export const ExplorerDatasourceEntity = (
  props: ExplorerDatasourceEntityProps,
) => {
  const params = useParams<ExplorerURLParams>();
  return (
    <Entity
      entityId={props.datasource.id}
      key={props.datasource.id}
      icon={queryIcon}
      name={props.datasource.name}
      active={params?.datasourceId === props.datasource.id}
      step={props.step + 1}
      searchKeyword={props.searchKeyword}
      action={() =>
        history.push(
          DATA_SOURCES_EDITOR_ID_URL(
            params.applicationId,
            params.pageId,
            props.datasource.id,
          ),
        )
      }
      contextMenu={
        <DataSourceContextMenu
          datasourceId={props.datasource.id}
          className={EntityClassNames.ACTION_CONTEXT_MENU}
        />
      }
    />
  );
};

export default ExplorerDatasourceEntity;
