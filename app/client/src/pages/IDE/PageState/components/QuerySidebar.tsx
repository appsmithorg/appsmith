import React, { useCallback, useLayoutEffect, useMemo } from "react";
import type { RouteComponentProps } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import { find, keyBy } from "lodash";
import { PluginType } from "../../../../entities/Action";
import QueryEditor from "../../../Editor/QueryEditor";
import { useFilteredFileOperations } from "../../../../components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { getActionConfig } from "../../../Editor/Explorer/Actions/helpers";
import history, { NavigationMethod } from "../../../../utils/history";
import ApiEditor from "../../../Editor/APIEditor";
import PagePaneContainer from "./PagePaneContainer";
import { getPluginIcon } from "../../../Editor/Explorer/ExplorerIcons";
import { useIDEDatasources } from "../../hooks";
import { importSvg } from "design-system-old";
import { getIdeSidebarWidth, getRecentQueryList } from "pages/IDE/ideSelector";
import styled from "styled-components";
import BlankState from "pages/IDE/components/BlankState";
import {
  setIdePageTabState,
  showAddDatasourceModal,
} from "pages/IDE/ideActions";
import { TabState } from "pages/IDE/ideReducer";
import { datasourcesEditorURL } from "RouteBuilder";
import type { Item } from "../../components/ListView";

const QueriesIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-queries.svg"),
);
const DatasourcesIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-datasources.svg"),
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
  const actions: Item[] = useSelector(getRecentQueryList);
  const datasources = useIDEDatasources();
  const leftPaneWidth = useSelector(getIdeSidebarWidth);
  const action = find(actions, (action) => action.key === actionId);
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
  const toListActions: Item[] = actions.map((action) => ({
    ...action,
    selected: action.key === actionId,
  }));

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

  useLayoutEffect(() => {
    if (!actionId) {
      if (toListActions.length) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        listItemClick(toListActions[0]);
      }
    }
  }, [actionId, toListActions.length]);

  let editor: JSX.Element = <div />;

  if (actionId && action) {
    if (action.pluginType === PluginType.DB) {
      editor = (
        <Wrapper width={leftPaneWidth}>
          <QueryEditor actionId={actionId} pageId={pageId} />
        </Wrapper>
      );
    } else if (action.pluginType === PluginType.API) {
      editor = (
        <div className="h-full">
          <ApiEditor match={{ params: { apiId: actionId, pageId } }} />
        </div>
      );
    }
  }

  const blankState = datasources.length ? (
    <BlankState
      buttonText={"New query"}
      description={"You have data. Write your first query."}
      image={QueriesIcon}
      onClick={() => {
        dispatch(setIdePageTabState(TabState.ADD));
      }}
    />
  ) : (
    <BlankState
      buttonText="New Datasource"
      description={
        "Experience the power of Appsmith by connecting to your data"
      }
      image={DatasourcesIcon}
      onClick={() => {
        history.push(datasourcesEditorURL({ pageId }));
        dispatch(showAddDatasourceModal(true));
      }}
    />
  );

  return (
    <PagePaneContainer
      addItems={addOperations}
      addStateTitle="Create a new query on..."
      blankState={blankState}
      editor={editor}
      listItems={toListActions}
      listStateTitle={`Queries in this page (${toListActions.length})`}
      onAddClick={addItemClick}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onListClick={listItemClick}
      titleItemCounts={4}
    />
  );
};

export default QuerySidebar;
