import React, { ReactNode, useCallback, memo } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { ExplorerURLParams, getActionIdFromURL } from "../helpers";
import { ActionGroupConfig } from "./helpers";
import { useParams } from "react-router";
import { GenericAction, ApiActionConfig } from "entities/Action";
import EntityPlaceholder from "../Entity/Placeholder";
import Entity from "../Entity";
import history from "utils/history";

type ExplorerActionsGroupProps = {
  actions: GenericAction[];
  step: number;
  searchKeyword?: string;
  config: ActionGroupConfig;
  page: Page;
};
export const ExplorerActionsGroup = memo((props: ExplorerActionsGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  let childNode: ReactNode = props.actions.map((action: GenericAction) => {
    const url = props.config?.getURL(
      params.applicationId,
      props.page.pageId,
      action.actionId,
    );
    const actionId = getActionIdFromURL();
    const active = actionId === action.actionId;

    let method = undefined;
    method = (action.config as ApiActionConfig).httpMethod;
    const icon = props.config?.getIcon(method);
    return (
      <ExplorerActionEntity
        key={action.actionId}
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

  if (!props.searchKeyword && (!childNode || !props.actions.length)) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No {props.config?.groupName || "Actions"} yet. Please click the{" "}
        <strong>+</strong> icon on
        <strong> {props.config?.groupName || "Actions"}</strong> above, to
        create.
      </EntityPlaceholder>
    );
  }

  const switchToCreateActionPage = useCallback(() => {
    const path = props.config?.generateCreatePageURL(
      params?.applicationId,
      props.page.pageId,
      props.page.pageId,
    );
    history.push(path);
  }, [props.config, props.page.pageId, params]);

  return (
    <Entity
      icon={props.config?.icon}
      name={props.config?.groupName || "Actions"}
      className={`group ${props.config?.groupName.toLowerCase()}`}
      entityId={props.page.pageId + "_" + props.config?.type}
      step={props.step}
      disabled={!!props.searchKeyword && (!childNode || !props.actions.length)}
      createFn={switchToCreateActionPage}
      isDefaultExpanded={
        props.config?.isGroupExpanded(params, props.page.pageId) ||
        !!props.searchKeyword
      }
      active={props.config?.isGroupActive(params, props.page.pageId)}
    >
      {childNode}
    </Entity>
  );
});

ExplorerActionsGroup.displayName = "ExplorerActionsGroup";

export default ExplorerActionsGroup;
