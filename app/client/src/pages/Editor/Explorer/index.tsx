import React, { useRef, MutableRefObject, useCallback } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { noop } from "lodash";
import {
  getPageEntityGroups,
  getDatasourceEntities,
  ExplorerURLParams,
} from "./helpers";
import { getColorWithOpacity } from "constants/DefaultTheme";

import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ExplorerTitle } from "./ExplorerTitle";
import Entity from "./Entity";
import { pageIcon, datasourceIcon } from "./ExplorerIcons";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import Divider from "components/editorComponents/Divider";
import { GenericAction } from "entities/Action";
import { useFilteredEntities } from "./hooks";
import Search from "./ExplorerSearch";
import { createPage } from "actions/pageActions";
import { getNextEntityName } from "utils/AppsmithUtils";

const Wrapper = styled.div`
  padding: ${props => props.theme.spaces[3]}px;
  height: 100%;
  overflow-y: auto;
  scrollbar-color: ${props => props.theme.colors.paneCard}
    ${props => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneCard};
    outline: 1px solid ${props => props.theme.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

const EntityExplorer = () => {
  const searchInputRef: MutableRefObject<HTMLInputElement | null> = useRef(
    null,
  );
  const params = useParams<ExplorerURLParams>();
  const {
    widgets,
    actions,
    dataSources,
    currentPageId,
    pages,
    plugins,
    isFiltered,
    clearSearch,
  } = useFilteredEntities(searchInputRef);
  const getPageEntities = (page: { pageId: string }) => [
    {
      type: ENTITY_TYPE.WIDGET,
      entries: widgets && widgets.pageId === page.pageId ? widgets : undefined,
    },
    {
      type: ENTITY_TYPE.ACTION,
      entries: actions
        ? actions.filter(
            (action: GenericAction) => action.config.pageId === page.pageId,
          )
        : [],
    },
  ];

  const dispatch = useDispatch();
  const createPageCallback = useCallback(() => {
    const name = getNextEntityName(
      "Page",
      pages.map(page => page.pageName),
    );
    dispatch(createPage(params.applicationId, name));
  }, [dispatch, pages, params.applicationId]);

  return (
    <Wrapper>
      <ExplorerTitle isCollapsed onCollapseToggle={noop} />
      <Search ref={searchInputRef} clear={clearSearch} />
      <Entity
        name="Pages"
        icon={pageIcon}
        isDefaultExpanded
        action={noop}
        entityId="Pages"
        step={0}
        createFn={createPageCallback}
      >
        {pages.map(page =>
          getPageEntityGroups(
            { id: page.pageId, name: page.pageName },
            getPageEntities(page),
            page.pageId === currentPageId,
            params,
            1,
            isFiltered,
          ),
        )}
      </Entity>
      <Divider />
      <Entity
        entityId="DataSources"
        step={0}
        name="DataSources"
        icon={datasourceIcon}
        action={noop}
        disabled={!dataSources || !dataSources.length}
        createFn={() => {
          history.push(
            DATA_SOURCES_EDITOR_URL(params.applicationId, params.pageId),
          );
        }}
      >
        {getDatasourceEntities(dataSources || [], plugins, params, 1)}
      </Entity>
    </Wrapper>
  );
};

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
