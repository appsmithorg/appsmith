import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteComponentProps } from "react-router";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  getActionsForCurrentPage,
  getPlugins,
  selectFilesForExplorer,
} from "../../../../selectors/entitiesSelector";
import { find, keyBy } from "lodash";
import { PluginType } from "../../../../entities/Action";
import QueryEditor from "../../../Editor/QueryEditor";
import ListSubTitle from "../../components/ListSubTitle";
import { Button } from "design-system";
import { useFilteredFileOperations } from "../../../../components/editorComponents/GlobalSearch/GlobalSearchHooks";
import ListView from "../../components/ListView";
import { getActionConfig } from "../../../Editor/Explorer/Actions/helpers";
import history, { NavigationMethod } from "../../../../utils/history";
import ApiEditor from "../../../Editor/APIEditor";

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

enum TabState {
  ADD = "ADD",
  EDIT = "EDIT",
  LIST = "LIST",
}

const QuerySidebar = (props: Props) => {
  const dispatch = useDispatch();
  const { actionId, pageId } = props.match.params;
  const [pageState, setPageState] = useState<TabState>(TabState.LIST);
  const actions = useSelector(getActionsForCurrentPage);
  const action = find(actions, (action) => action.config.id === actionId);
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  useEffect(() => {
    if (action) {
      setPageState(TabState.EDIT);
    } else if (actions.length === 0) {
      setPageState(TabState.ADD);
    }
  }, []);
  const fileOperations = useFilteredFileOperations();
  const addOperations = fileOperations.map((op) => {
    return {
      name: op.title,
      icon: op.icon,
      key: op.title,
    };
  });
  const addItemClick = useCallback(
    (item: { key: string }) => {
      const operation = fileOperations.find((a) => a.title === item.key);
      if (operation) {
        if (operation.action) {
          dispatch(operation.action(pageId, "ENTITY_EXPLORER"));
        } else if (operation.redirect) {
          operation.redirect(pageId, "ENTITY_EXPLORER");
        }
      }
    },
    [fileOperations],
  );
  const allActions = useSelector(selectFilesForExplorer);
  const toListActions = allActions
    .filter((a: any) => {
      if (a.type === "group") {
        return false;
      }
      if (a.type === "JS") {
        return false;
      }
      return true;
    })
    .map((a: any) => ({
      name: a.entity.name,
      key: a.entity.id,
      type: a.type,
      pluginId: a.entity.pluginId,
    }));

  const listItemClick = useCallback(
    (a: { type: PluginType; key: string; pluginId: string; name: string }) => {
      const config = getActionConfig(a.type);
      const url = config?.getURL(
        pageId,
        a.key,
        a.type,
        pluginGroups[a.pluginId],
      );
      if (url) {
        history.push(url, { invokedBy: NavigationMethod.EntityExplorer });
        setPageState(TabState.EDIT);
      }
    },
    [plugins],
  );

  let title = "";
  let rightIcon: React.ReactNode = null;
  let leftIcon: React.ReactNode = null;
  let body: React.ReactNode = (
    <EmptyStateContainer>
      <h2>Select a query</h2>
    </EmptyStateContainer>
  );
  switch (pageState) {
    case TabState.ADD:
      title = "Add";
      rightIcon = (
        <Button
          kind={"secondary"}
          onClick={() => setPageState(TabState.EDIT)}
          startIcon={"cross"}
        />
      );
      body = <ListView items={addOperations} onClick={addItemClick} />;
      break;
    case TabState.LIST:
      title = `Queries on this page (${actions.length})`;
      rightIcon = (
        <Button
          kind={"secondary"}
          onClick={() => setPageState(TabState.EDIT)}
          startIcon={"cross"}
        />
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      body = <ListView items={toListActions} onClick={listItemClick} />;
      break;
    case TabState.EDIT:
      title = action?.config.name || "";
      if (actions.length > 1) {
        rightIcon = (
          <Button
            kind={"secondary"}
            onClick={() => setPageState(TabState.LIST)}
          >
            {actions.length - 1} More
          </Button>
        );
      }

      leftIcon = (
        <Button
          isIconButton
          kind={"secondary"}
          onClick={() => setPageState(TabState.ADD)}
          startIcon={"plus"}
        />
      );
      if (actionId && action) {
        if (
          [PluginType.DB, PluginType.SAAS].includes(action.config.pluginType)
        ) {
          body = (
            <div className="h-full">
              <QueryEditor actionId={actionId} pageId={pageId} />
            </div>
          );
        } else if (action.config.pluginType === PluginType.API) {
          body = (
            <div className="h-full">
              <ApiEditor
                match={{ params: { apiId: action.config.id, pageId } }}
              />
            </div>
          );
        }
      }
      break;
  }
  return (
    <div className="h-full">
      <ListSubTitle
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        title={title || ""}
      />
      {body}
    </div>
  );
};

export default QuerySidebar;
