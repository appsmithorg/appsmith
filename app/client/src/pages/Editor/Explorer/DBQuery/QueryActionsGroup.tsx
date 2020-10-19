import { Page } from "constants/ReduxActionConstants";
import React, { memo, ReactNode } from "react";
import { useParams } from "react-router";
import ExplorerActionEntity from "../Actions/ActionEntity";
import { ActionGroupConfig } from "../Actions/helpers";
import { ExplorerURLParams, getActionIdFromURL } from "../helpers";

type ExplorerQueryActionsProps = {
  actions: any[];
  step: number;
  searchKeyword?: string;
  config: ActionGroupConfig;
  page: Page;
};

const ExplorerQueryActionsGroup = memo((props: ExplorerQueryActionsProps) => {
  const params = useParams<ExplorerURLParams>();
  let content: ReactNode = <div />;

  content = props.actions.map((action: any) => {
    const url = props.config?.getURL(
      params.applicationId,
      props.page.pageId,
      action.config.id,
    );
    const actionId = getActionIdFromURL();
    const active = actionId === action.config.id;

    const icon = props.config?.getIcon();
    return (
      <ExplorerActionEntity
        key={action.config.id}
        action={action}
        url={url}
        active={active}
        icon={icon}
        step={props.step}
        searchKeyword={props.searchKeyword}
        pageId={props.page.pageId}
      />
    );
  });

  return <>{content}</>;
});

ExplorerQueryActionsGroup.displayName = "ExplorerQueryActionsGroup";

export default ExplorerQueryActionsGroup;
