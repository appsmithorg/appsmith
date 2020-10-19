import { Datasource } from "api/DatasourcesApi";
import { Page } from "constants/ReduxActionConstants";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { PluginType } from "entities/Action";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { keyBy } from "lodash";
import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import history from "utils/history";
import { getActionConfig, getQueryActionsGroup } from "../Actions/helpers";
import ExplorerDatasourceEntity from "../Datasources/DatasourceEntity";
import Entity from "../Entity";
import EntityPlaceholder from "../Entity/Placeholder";
import { datasourceIcon } from "../ExplorerIcons";
import { ExplorerURLParams } from "../helpers";

type ExplorerDBQueryGroupProps = {
  step: number;
  searchKeyword?: string;
  datasources: Datasource[];
  actions: any[];
  page: Page;
};

const DBQueryGroup = (props: ExplorerDBQueryGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const actionConfig = getActionConfig(PluginType.DB);
  const switchToCreateActionPage = useCallback(() => {
    const path = actionConfig?.generateCreatePageURL(
      params?.applicationId,
      props.page.pageId,
      props.page.pageId,
    );
    history.push(path);
  }, [actionConfig, props.page.pageId, params]);

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const disableGroup =
    !!props.searchKeyword && !props.datasources.length && !props.actions.length;
  const queryActionsNode = getQueryActionsGroup(
    props.page,
    props.step + 1,
    props.actions as DataTreeAction[],
    props.searchKeyword,
  );
  const isEmpty = !props.searchKeyword && !props.datasources.length;

  const emptyNode = (
    <EntityPlaceholder step={props.step + 1}>
      No datasources yet. Please click the <strong>+</strong> icon on
      <strong> DB Query</strong> above, to create.
    </EntityPlaceholder>
  );

  return (
    <Entity
      entityId="DBQuery"
      step={props.step}
      className="group dbquery"
      name="DB Query"
      icon={datasourceIcon}
      active={
        window.location.pathname.indexOf(
          DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
        ) > -1 || actionConfig?.isGroupActive(params, props.page.pageId)
      }
      isDefaultExpanded={
        actionConfig?.isGroupExpanded(params, props.page.pageId) ||
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
          {queryActionsNode}
          {props.datasources.map((datasource: Datasource) => {
            return (
              <ExplorerDatasourceEntity
                plugin={pluginGroups[datasource.pluginId]}
                key={datasource.id}
                datasource={datasource}
                step={props.step + 1}
                searchKeyword={props.searchKeyword}
              />
            );
          })}
        </>
      )}
    </Entity>
  );
};

export default DBQueryGroup;
