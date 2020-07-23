import React, { ReactNode } from "react";
import ExplorerActionEntity from "./ActionEntity";
import { Page } from "constants/ReduxActionConstants";
import { ExplorerURLParams } from "../helpers";
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
export const ExplorerActionsGroup = (props: ExplorerActionsGroupProps) => {
  const params = useParams<ExplorerURLParams>();
  let childNode: ReactNode = props.actions.map((action: GenericAction) => {
    const url = props.config?.getURL(
      params.applicationId,
      props.page.pageId,
      action.actionId,
    );
    const active =
      params?.apiId === action.actionId || params?.queryId === action.actionId;

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
      />
    );
  });

  if (!props.searchKeyword && (!childNode || !props.actions.length)) {
    childNode = (
      <EntityPlaceholder step={props.step + 1}>
        No {props.config?.groupName || "Actions"} yet. Please click the{" "}
        <strong>+</strong> icon on
        <strong> {props.config?.groupName || "Actions"}</strong> to create.
      </EntityPlaceholder>
    );
  }
  return (
    <Entity
      icon={props.config?.icon}
      name={props.config?.groupName || "Actions"}
      entityId={props.page.pageId + "_" + props.config?.type}
      step={props.step}
      disabled={!!props.searchKeyword && (!childNode || !props.actions.length)}
      createFn={() => {
        const path = props.config?.generateCreatePageURL(
          params?.applicationId,
          params?.pageId,
          params?.pageId,
        );
        history.push(path);
      }}
      isDefaultExpanded={
        props.config?.isGroupActive(params) || !!props.searchKeyword
      }
      active={props.config?.isGroupActive(params)}
    >
      {childNode}
    </Entity>
  );
};

export default ExplorerActionsGroup;
