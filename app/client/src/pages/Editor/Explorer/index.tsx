import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { noop } from "lodash";
import { useEntities } from "./hooks";
import { getPageEntityGroups, getDatasourceEntities } from "./helpers";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ExplorerTitle } from "./ExplorerTitle";
import Entity from "./Entity";
import { pageIcon, datasourceIcon } from "./ExplorerIcons";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import Divider from "components/editorComponents/Divider";
const Wrapper = styled.div`
  padding: ${props => props.theme.spaces[3]}px;
  height: 100%;
  overflow-y: auto;
`;

const EntityExplorer = () => {
  const params = useParams<{
    applicationId: string;
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();
  const {
    pages,
    widgetTree,
    actions,
    currentPageId,
    dataSources,
    plugins,
  } = useEntities();
  const dispatch = useDispatch();
  return (
    <Wrapper>
      <ExplorerTitle isCollapsed onCollapseToggle={noop} />
      <Entity
        name="DataSources"
        icon={datasourceIcon}
        action={noop}
        createFn={() => {
          history.push(
            DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
          );
        }}
      >
        {getDatasourceEntities(dataSources, plugins, params)}
      </Entity>
      <Divider />
      <Entity name="Pages" icon={pageIcon} isDefaultExpanded action={noop}>
        {pages.map(page =>
          getPageEntityGroups(
            { id: page.pageId, name: page.pageName },
            [
              {
                type: ENTITY_TYPE.ACTION,
                entries: actions.filter(
                  action => action.config.pageId === page.pageId,
                ),
              },
              {
                type: ENTITY_TYPE.WIDGET,
                entries: widgetTree.pageId === page.pageId ? widgetTree : [],
              },
            ],
            page.pageId === currentPageId,
            params,
            dispatch,
          ),
        )}
      </Entity>
    </Wrapper>
  );
};

export default EntityExplorer;
