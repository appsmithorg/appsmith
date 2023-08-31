import React from "react";
import type { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getActions } from "../../../../selectors/entitiesSelector";
import { find } from "lodash";
import { PluginType } from "../../../../entities/Action";
import QueryEditor from "../../../Editor/QueryEditor";

type Props = RouteComponentProps<{
  appId: string;
  pageId: string;
  actionId?: string;
}>;

const EmptyStateContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QuerySidebar = (props: Props) => {
  const { actionId, pageId } = props.match.params;
  const actions = useSelector(getActions);
  if (!actionId) {
    return (
      <EmptyStateContainer>
        <h2>Select a query</h2>
      </EmptyStateContainer>
    );
  }
  const action = find(actions, (action) => action.config.id === actionId);
  if (
    action &&
    [PluginType.DB, PluginType.SAAS].includes(action.config.pluginType)
  ) {
    return (
      <div className="h-full">
        <QueryEditor actionId={actionId} pageId={pageId} />
      </div>
    );
  }
  return <div />;
};

export default QuerySidebar;
