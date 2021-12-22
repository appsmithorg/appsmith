import React, { memo, ReactElement } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { ActionGroupConfig } from "./helpers";
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
  const childNode: ReactElement<ExplorerActionsGroupProps> = (
    <>
      {props.actions.map((action: any) => {
        return (
          <ExplorerActionEntity
            id={action.config.id}
            isActive={false}
            key={action.config.id}
            searchKeyword={props.searchKeyword}
            step={props.step + 1}
            type={action.config.pluginType}
          />
        );
      })}
    </>
  );

  return childNode;
});

ExplorerActionsGroup.displayName = "ExplorerActionsGroup";

export default ExplorerActionsGroup;
