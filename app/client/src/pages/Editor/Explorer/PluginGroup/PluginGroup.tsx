import { Datasource } from "api/DatasourcesApi";
import { Page } from "constants/ReduxActionConstants";
import { keyBy } from "lodash";
import React, { memo, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import history from "utils/history";
import ExplorerActionsGroup from "../Actions/ActionsGroup";
import { ActionGroupConfig } from "../Actions/helpers";
import ExplorerDatasourceEntity from "../Datasources/DatasourceEntity";
import Entity from "../Entity";
import EntityPlaceholder from "../Entity/Placeholder";
import { ExplorerURLParams } from "../helpers";

type ExplorerPluginGroupProps = {
  step: number;
  searchKeyword?: string;
  datasources: Datasource[];
  actions: any[];
  page: Page;
  actionConfig: ActionGroupConfig;
};

const ExplorerPluginGroup = memo((props: ExplorerPluginGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const switchToCreateActionPage = useCallback(() => {
    const path = props.actionConfig?.generateCreatePageURL(
      params?.applicationId,
      props.page.pageId,
      props.page.pageId,
    );
    history.push(path);
  }, [props.actionConfig, props.page.pageId, params]);

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const disableGroup =
    !!props.searchKeyword && !props.datasources.length && !props.actions.length;

  const isEmpty =
    !props.searchKeyword && !props.datasources.length && !props.actions.length;

  const emptyNode = (
    <EntityPlaceholder step={props.step + 1}>
      No {props.actionConfig?.groupName || "Plugin Groups"} yet. Please click
      the <strong>+</strong> icon on
      <strong> {props.actionConfig?.groupName || "Plugin Groups"}</strong>{" "}
      above, to create.
    </EntityPlaceholder>
  );

  return (
    <Entity
      entityId={props.page.pageId + "_" + props.actionConfig?.type}
      step={props.step}
      className={`group ${props.actionConfig?.groupName
        .toLowerCase()
        .replace(/ /g, "")}`}
      name={props.actionConfig?.groupName || "Plugin Group"}
      icon={props.actionConfig?.icon}
      active={props.actionConfig?.isGroupActive(params, props.page.pageId)}
      isDefaultExpanded={
        props.actionConfig?.isGroupExpanded(params, props.page.pageId) ||
        !!props.searchKeyword ||
        !!props.datasources.length
      }
      disabled={disableGroup}
      onCreate={switchToCreateActionPage}
    >
      {isEmpty ? (
        emptyNode
      ) : (
        <>
          <ExplorerActionsGroup
            actions={props.actions}
            step={props.step}
            page={props.page}
            searchKeyword={props.searchKeyword}
            config={props.actionConfig}
            plugins={pluginGroups}
          />
          {props.datasources.map((datasource: Datasource) => {
            return (
              <ExplorerDatasourceEntity
                plugin={pluginGroups[datasource.pluginId]}
                key={datasource.id}
                datasource={datasource}
                step={props.step + 1}
                searchKeyword={props.searchKeyword}
                pageId={props.page.pageId}
              />
            );
          })}
        </>
      )}
    </Entity>
  );
});

ExplorerPluginGroup.displayName = "ExplorerPluginGroup";

export default ExplorerPluginGroup;
