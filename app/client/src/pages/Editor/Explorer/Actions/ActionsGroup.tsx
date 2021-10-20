import React, { memo, ReactElement } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { getActionIdFromURL } from "../helpers";
import { ActionGroupConfig } from "./helpers";
import { Plugin } from "api/PluginApi";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";

type ExplorerActionsGroupProps = {
  actions: any[];
  step: number;
  searchKeyword?: string;
  config: ActionGroupConfig;
  page: Page;
  plugins: Record<string, Plugin>;
};
export const ExplorerActionsGroup = memo((props: ExplorerActionsGroupProps) => {
  const applicationId = useSelector(getCurrentApplicationId);
  const childNode: ReactElement<ExplorerActionsGroupProps> = (
    <>
      {props.actions.map((action: any) => {
        const url = props.config?.getURL(
          applicationId,
          props.page.pageId,
          action.config.id,
          action.config.pluginType,
          props.plugins[
            action.config.pluginId || action.config.datasource.pluginId
          ],
        );
        const actionId = getActionIdFromURL();
        const active = actionId === action.config.id;

        const icon = props.config?.getIcon(
          action.config,
          props.plugins[
            action.config.pluginId || action.config.datasource.pluginId
          ],
        );
        return (
          <ExplorerActionEntity
            action={action}
            active={active}
            icon={icon}
            key={action.config.id}
            pageId={props.page.pageId}
            searchKeyword={props.searchKeyword}
            step={props.step + 1}
            url={url}
          />
        );
      })}
    </>
  );

  return childNode;
});

ExplorerActionsGroup.displayName = "ExplorerActionsGroup";

export default ExplorerActionsGroup;
