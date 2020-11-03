import React, { ReactNode, memo } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { ExplorerURLParams, getActionIdFromURL } from "../helpers";
import { ActionGroupConfig } from "./helpers";
import { useParams } from "react-router";
import { Plugin } from "api/PluginApi";

type ExplorerActionsGroupProps = {
  actions: any[];
  step: number;
  searchKeyword?: string;
  config: ActionGroupConfig;
  page: Page;
  plugins: Record<string, Plugin>;
};
export const ExplorerActionsGroup = memo((props: ExplorerActionsGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  const childNode: ReactNode = props.actions.map((action: any) => {
    const url = props.config?.getURL(
      params.applicationId,
      props.page.pageId,
      action.config.id,
    );
    const actionId = getActionIdFromURL();
    const active = actionId === action.config.id;

    const icon = props.config?.getIcon(
      action.config,
      props.plugins[action.config.datasource.pluginId],
    );
    return (
      <ExplorerActionEntity
        key={action.config.id}
        action={action}
        url={url}
        active={active}
        icon={icon}
        step={props.step + 1}
        searchKeyword={props.searchKeyword}
        pageId={props.page.pageId}
      />
    );
  });

  return <>{childNode}</>;
});

ExplorerActionsGroup.displayName = "ExplorerActionsGroup";

export default ExplorerActionsGroup;
