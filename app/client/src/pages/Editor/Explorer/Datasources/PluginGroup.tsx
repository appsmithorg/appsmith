import React from "react";
import Entity from "../Entity";
import { Plugin } from "api/PluginApi";
import { Datasource } from "api/DatasourcesApi";
import { getPluginIcon } from "../ExplorerIcons";
import { getDatasourceIdFromURL } from "../helpers";
import ExplorerDatasourceEntity from "./DatasourceEntity";

type DatasourcePluginGroupProps = {
  plugin?: Plugin;
  datasources: Datasource[];
  step: number;
  searchKeyword?: string;
};
export const DatasourcePluginGroup = (props: DatasourcePluginGroupProps) => {
  const pluginIcon = getPluginIcon(props.plugin);
  const datasourceIdFromURL = getDatasourceIdFromURL();
  const currentGroup =
    !!datasourceIdFromURL &&
    props.datasources
      .map((datasource: Datasource) => datasource.id)
      .indexOf(datasourceIdFromURL) > -1;

  return (
    <Entity
      entityId="Plugin"
      className="group datasources"
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
