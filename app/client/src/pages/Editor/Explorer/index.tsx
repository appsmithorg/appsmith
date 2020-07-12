import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { noop } from "lodash";
import { useEntities } from "./hooks";
import {
  getPageEntityGroups,
  getDatasourceEntities,
  ExplorerURLParams,
} from "./helpers";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ExplorerTitle } from "./ExplorerTitle";
import Entity from "./Entity";
import { pageIcon, datasourceIcon } from "./ExplorerIcons";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import Divider from "components/editorComponents/Divider";
import { Icon, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { Datasource } from "api/DatasourcesApi";
import { Action, GenericAction } from "entities/Action";
import { debounce } from "lodash";

const Wrapper = styled.div`
  padding: ${props => props.theme.spaces[3]}px;
  height: 100%;
  overflow-y: auto;
`;

const ExplorerSearchWrapper = styled.div`
  display: flex;
  margin: 10px 0;
  justify-content: flex-start;
  align-items: center;
  & {
    .${Classes.ICON} {
      color: ${Colors.MAKO};
    }
    input {
      border: none;
      background: none;
      margin-left: 10px;
      color: ${Colors.WHITE};
    }
  }
`;

const findWidgets = (widgets: any, keyword: string) => {
  return widgets;
};

const findActions = (actions: Array<GenericAction>, keyword: string) => {
  return actions.filter(
    (action: { config: Action }) => action.config.name.indexOf(keyword) > -1,
  );
};

const findDataSources = (dataSources: Datasource[], keyword: string) => {
  return dataSources.filter(
    (dataSource: Datasource) => dataSource.name.indexOf(keyword) > -1,
  );
};

const useFilteredEntities = (
  ref: MutableRefObject<HTMLInputElement | null>,
) => {
  const [entities, setEntities] = useState<{
    widgets?: any;
    actions?: Array<GenericAction>;
    dataSources?: Datasource[];
  }>({});
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const {
    widgetTree,
    actions,
    dataSources,
    pages,
    currentPageId,
    plugins,
  } = useEntities();
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (searchKeyword !== null) {
      const filtered = {
        widgets: findWidgets(widgetTree, searchKeyword),
        actions: findActions(actions, searchKeyword),
        dataSources: findDataSources(dataSources, searchKeyword),
      };
      setEntities(filtered);
    } else {
      setEntities({ widgets: widgetTree, actions, dataSources });
    }
  }, [searchKeyword]);

  const search = debounce((e: any) => {
    const keyword = e.target.value;
    if (keyword.trim().length > 2) {
      setSearchKeyword(keyword);
    } else {
      setSearchKeyword(null);
    }
  }, 300);

  useEffect(() => {
    const el: HTMLInputElement | null = ref.current;
    el?.addEventListener("keydown", search);
    return () => {
      el?.removeEventListener("keydown", search);
    };
  }, [ref, search]);
  return { ...entities, currentPageId, plugins, pages };
};

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
  } = useFilteredEntities(searchInputRef);

  const dispatch = useDispatch();
  return (
    <Wrapper>
      <ExplorerTitle isCollapsed onCollapseToggle={noop} />
      <ExplorerSearchWrapper>
        <Icon icon="filter" iconSize={16} />
        <input
          type="text"
          placeholder="Filter entities..."
          ref={searchInputRef}
        />
      </ExplorerSearchWrapper>
      <Entity
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
        {getDatasourceEntities(dataSources || [], plugins, params)}
      </Entity>
      <Divider />
      <Entity name="Pages" icon={pageIcon} isDefaultExpanded action={noop}>
        {pages.map(page =>
          getPageEntityGroups(
            { id: page.pageId, name: page.pageName },
            [
              {
                type: ENTITY_TYPE.ACTION,
                entries: actions
                  ? actions.filter(
                      (action: GenericAction) =>
                        action.config.pageId === page.pageId,
                    )
                  : [],
              },
              {
                type: ENTITY_TYPE.WIDGET,
                entries:
                  widgets && widgets.pageId === page.pageId ? widgets : [],
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
