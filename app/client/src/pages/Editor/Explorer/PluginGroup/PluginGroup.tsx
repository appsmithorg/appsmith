import { Datasource } from "entities/Datasource";
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
import { INTEGRATION_TABS, INTEGRATION_EDITOR_MODES } from "constants/routes";
import { ADD_DATASOURCE_TOOLTIP, createMessage } from "constants/messages";

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
      INTEGRATION_TABS.NEW,
      INTEGRATION_EDITOR_MODES.AUTO,
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
      Please click the <strong>+</strong> icon above, to create new{" "}
      {props.actionConfig?.groupName || "Plugin Groups"}
    </EntityPlaceholder>
  );

  return (
    <Entity
      active={props.actionConfig?.isGroupActive(params, props.page.pageId)}
      addButtonHelptext={createMessage(ADD_DATASOURCE_TOOLTIP)}
      className={`group ${props.actionConfig?.groupName
        .toLowerCase()
        .replace(/ /g, "")}`}
      disabled={disableGroup}
      entityId={props.page.pageId + "_" + props.actionConfig?.types.join("_")}
      icon={props.actionConfig?.icon}
      isDefaultExpanded={
        props.actionConfig?.isGroupExpanded(params, props.page.pageId) ||
        !!props.searchKeyword ||
        !!props.datasources.length
      }
      name={props.actionConfig?.groupName || "Plugin Group"}
      onCreate={switchToCreateActionPage}
      step={props.step}
    >
      {isEmpty ? (
        emptyNode
      ) : (
        <>
          <ExplorerActionsGroup
            actions={props.actions}
            config={props.actionConfig}
            page={props.page}
            plugins={pluginGroups}
            searchKeyword={props.searchKeyword}
            step={props.step}
          />
          {props.datasources.map((datasource: Datasource) => {
            return (
              <ExplorerDatasourceEntity
                datasource={datasource}
                key={datasource.id}
                pageId={props.page.pageId}
                plugin={pluginGroups[datasource.pluginId]}
                searchKeyword={props.searchKeyword}
                step={props.step + 1}
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
