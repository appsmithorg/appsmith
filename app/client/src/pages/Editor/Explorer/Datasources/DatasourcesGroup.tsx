import React, { useMemo, ReactNode } from "react";
import { Datasource } from "api/DatasourcesApi";
import { datasourceIcon } from "../ExplorerIcons";
import Entity from "../Entity";
import { groupBy } from "lodash";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import history from "utils/history";
import { Plugin } from "api/PluginApi";
import DatasourcePluginGroup from "./PluginGroup";

type ExplorerDatasourcesGroupProps = {
  dataSources: Datasource[];
  plugins: Plugin[];
  step: number;
  searchKeyword?: string;
};

export const ExplorerDatasourcesGroup = (
  props: ExplorerDatasourcesGroupProps,
) => {
  const params = useParams<ExplorerURLParams>();
  const disableDatasourceGroup =
    !props.dataSources || !props.dataSources.length;

  const pluginGroups = useMemo(() => groupBy(props.dataSources, "pluginId"), [
    props.dataSources,
  ]);

  const pluginGroupNodes: ReactNode[] = [];
  for (const [pluginId, datasources] of Object.entries(pluginGroups)) {
    const plugin = props.plugins.find(
      (plugin: Plugin) => plugin.id === pluginId,
    );

    pluginGroupNodes.push(
      <DatasourcePluginGroup
        plugin={plugin}
        datasources={datasources}
        searchKeyword={props.searchKeyword}
        step={props.step + 1}
        key={plugin?.id || "unknown-plugin"}
      />,
    );
  }
  return (
    <Entity
      entityId="DataSources"
      step={props.step}
      name="DataSources"
      icon={datasourceIcon}
      active={
        window.location.pathname.indexOf(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        ) > -1
      }
      isDefaultExpanded={
        window.location.pathname.indexOf(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        ) > -1 || !!props.searchKeyword
      }
      disabled={disableDatasourceGroup}
      createFn={() => {
        history.push(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        );
      }}
    >
      {pluginGroupNodes}
    </Entity>
  );
};

export default ExplorerDatasourcesGroup;
