import React, { useMemo } from "react";
import { datasourceIcon } from "../ExplorerIcons";
import Entity from "../Entity";
import { keyBy } from "lodash";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import history from "utils/history";

import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { Datasource } from "api/DatasourcesApi";
import ExplorerDatasourceEntity from "./DatasourceEntity";

type ExplorerDatasourcesGroupProps = {
  step: number;
  searchKeyword?: string;
  datasources?: Datasource[];
};

export const ExplorerDatasourcesGroup = (
  props: ExplorerDatasourcesGroupProps,
) => {
  const params = useParams<ExplorerURLParams>();
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const { datasources = [] } = props;
  const disableDatasourceGroup = !datasources || !datasources.length;

  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  if (disableDatasourceGroup && props.searchKeyword) return null;
  return (
    <Entity
      entityId="DataSources"
      step={props.step}
      className="group plugins"
      name="DataSources"
      icon={datasourceIcon}
      active={
        window.location.pathname.indexOf(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        ) > -1
      }
      isDefaultExpanded
      disabled={disableDatasourceGroup}
      onCreate={() => {
        history.push(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        );
      }}
    >
      {datasources.map((datasource: Datasource, index: number) => {
        return (
          <ExplorerDatasourceEntity
            plugin={pluginGroups[datasource.pluginId]}
            key={datasource.id}
            isDefaultExpanded={index === 0}
            datasource={datasource}
            step={props.step + 1}
            searchKeyword={props.searchKeyword}
          />
        );
      })}
    </Entity>
  );
};

export default ExplorerDatasourcesGroup;
