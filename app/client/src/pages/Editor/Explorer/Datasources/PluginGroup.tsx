import React from "react";
import Entity from "../Entity";
import { Plugin } from "api/PluginApi";
import { Datasource } from "api/DatasourcesApi";
import { getPluginIcon } from "../ExplorerIcons";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import ExplorerDatasourceEntity from "./DatasourceEntity";

type DatasourcePluginGroupProps = {
  plugin?: Plugin;
  datasources: Datasource[];
  step: number;
  searchKeyword?: string;
};
export const DatasourcePluginGroup = (props: DatasourcePluginGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const pluginIcon = getPluginIcon(props.plugin);
  const currentGroup =
    !!params.datasourceId &&
    props.datasources
      .map((datasource: Datasource) => datasource.id)
      .indexOf(params.datasourceId) > -1;

  return (
    <Entity
      entityId="Plugin"
      icon={pluginIcon}
      name={props.plugin?.name || "Unknown Plugin"}
      active={currentGroup}
      isDefaultExpanded={currentGroup || !!props.searchKeyword}
      step={props.step}
    >
      {props.datasources.map((datasource: Datasource) => {
        return (
          <ExplorerDatasourceEntity
            key={datasource.id}
            datasource={datasource}
            step={props.step + 1}
            searchKeyword={props.searchKeyword}
          />
        );
      })}
    </Entity>
  );
};

export default DatasourcePluginGroup;
