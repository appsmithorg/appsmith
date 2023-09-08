import React, { useCallback, useMemo } from "react";
import type { RouteComponentProps } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  getActionsForCurrentPage,
  getPlugins,
} from "../../../../selectors/entitiesSelector";
import { find, keyBy } from "lodash";
import { PluginType } from "../../../../entities/Action";
import QueryEditor from "../../../Editor/QueryEditor";
import { useFilteredFileOperations } from "../../../../components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { getActionConfig } from "../../../Editor/Explorer/Actions/helpers";
import history, { NavigationMethod } from "../../../../utils/history";
import ApiEditor from "../../../Editor/APIEditor";
import PagePaneContainer from "./PagePaneContainer";
import { getPluginIcon } from "../../../Editor/Explorer/ExplorerIcons";
import { useIDEPageRecent } from "../../hooks";
import { importSvg } from "design-system-old";
import { getIdeSidebarWidth } from "pages/IDE/ideSelector";
import styled from "styled-components";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-queries.svg"),
);

type Props = RouteComponentProps<{
  appId: string;
  pageId: string;
  actionId?: string;
}>;

const Wrapper = styled.div<{ width: number }>`
  height: 100%;
  display: flex;
  width: ${(props) => props.width - 6}px;
  overflow: hidden;
`;

const QuerySidebar = (props: Props) => {
  const dispatch = useDispatch();
  const { actionId, pageId } = props.match.params;
  const actions = useSelector(getActionsForCurrentPage);
  const leftPaneWidth = useSelector(getIdeSidebarWidth);
  const supportedActions = actions.filter(
    (a) => a.config.pluginType !== PluginType.SAAS,
  );
  const action = find(
    supportedActions,
    (action) => action.config.id === actionId,
  );
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const fileOperations = useFilteredFileOperations();
  const addOperations = fileOperations
    .filter((op) => {
      if (op.pluginId) {
        const plugin = pluginGroups[op.pluginId];
        return plugin.type !== PluginType.SAAS;
      }
      return true;
    })
    .map((op) => {
      let icon = op.icon;
      if (op.pluginId) {
        icon = getPluginIcon(pluginGroups[op.pluginId]);
      }
      return {
        name: op.title,
        icon,
        key: op.title,
      };
    });
  const addItemClick = useCallback(
    (item?: { key: string }) => {
      if (item) {
        const operation = fileOperations.find((a) => a.title === item.key);
        if (operation) {
          if (operation.action) {
            dispatch(operation.action(pageId, "ENTITY_EXPLORER"));
          } else if (operation.redirect) {
            operation.redirect(pageId, "ENTITY_EXPLORER");
          }
        }
      }
    },
    [fileOperations],
  );
  const toListActions = supportedActions.map((action) => ({
    name: action.config.name,
    key: action.config.id,
    type: action.config.pluginType,
    pluginId: action.config.pluginId,
    icon: getPluginIcon(pluginGroups[action.config.pluginId]),
  }));

  const [sortedActionList] = useIDEPageRecent(toListActions, actionId);

  const listItemClick = useCallback(
    (a: { type?: PluginType; key: string; pluginId: string; name: string }) => {
      if (a.type) {
        const config = getActionConfig(a.type);
        const url = config?.getURL(
          pageId,
          a.key,
          a.type,
          pluginGroups[a.pluginId],
        );
        if (url) {
          history.push(url, { invokedBy: NavigationMethod.EntityExplorer });
        }
      }
    },
    [plugins],
  );

  let editor: React.ReactNode = <div />;

  if (actionId && action) {
    if (action.config.pluginType === PluginType.DB) {
      editor = (
        <Wrapper width={leftPaneWidth}>
          <QueryEditor actionId={actionId} pageId={pageId} />
        </Wrapper>
      );
    } else if (action.config.pluginType === PluginType.API) {
      editor = (
        <div className="h-full">
          <ApiEditor match={{ params: { apiId: action.config.id, pageId } }} />
        </div>
      );
    }
  }

  return (
    <PagePaneContainer
      addItems={addOperations}
      addStateTitle="Create a new query on..."
      blankState={{
        image: DataIcon,
        description: "You have data. Write your first query.",
        buttonText: "New query",
      }}
      editor={editor}
      listItems={sortedActionList}
      listStateTitle={`Queries in this page (${sortedActionList.length})`}
      onAddClick={addItemClick}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onListClick={listItemClick}
      titleItemCounts={4}
    />
  );
};

export default QuerySidebar;
