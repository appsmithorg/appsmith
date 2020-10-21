import React, { ReactNode, memo } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { ExplorerURLParams, getActionIdFromURL } from "../helpers";
import { ActionGroupConfig } from "./helpers";
import { useParams } from "react-router";

type ExplorerActionsGroupProps = {
  actions: any[];
  step: number;
  searchKeyword?: string;
  config: ActionGroupConfig;
  page: Page;
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

    let method = undefined;
    method = action.config.actionConfiguration.httpMethod;
    const icon = props.config?.getIcon(method);
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
