import React, { useCallback, ReactNode } from "react";
import { Datasource } from "api/DatasourcesApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { queryIcon } from "../ExplorerIcons";
import DatasourceStructure from "./DatasourceStructure";
import { useParams } from "react-router";
import { ExplorerURLParams, getDatasourceIdFromURL } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import { saveDatasourceName } from "actions/datasourceActions";
import EntityPlaceholder from "../Entity/Placeholder";

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

  const updateDatasourceName = (id: string, name: string) =>
    saveDatasourceName({ id, name });
  const datasourceStructure = props.datasource?.structure;

  let childNode: ReactNode =
    datasourceStructure &&
    datasourceStructure.map((structure: any) => (
      <DatasourceStructure
        key={structure.name}
        dbStructure={structure}
        step={props.step + 1}
        datasourceId={props.datasource.id}
      />
    ));

  if (!childNode) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No information available
      </EntityPlaceholder>
    );
  }

  return (
    <Entity
      entityId={props.datasource.id}
      className="datasource"
      key={props.datasource.id}
      icon={queryIcon}
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
    >
      {childNode}
    </Entity>
  );
};

export default ExplorerDatasourceEntity;
