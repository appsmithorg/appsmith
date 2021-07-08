import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useParams } from "react-router";
import history from "utils/history";
import { AppState } from "reducers";
import SearchModal from "./SearchModal";
import AlgoliaSearchWrapper from "./AlgoliaSearchWrapper";
import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";
import SetSearchResults from "./SetSearchResults";
import GlobalSearchHotKeys from "./GlobalSearchHotKeys";
import SearchContext from "./GlobalSearchContext";
import Description from "./Description";
import ResultsNotFound from "./ResultsNotFound";
import { getActions, getAllPageWidgets } from "selectors/entitiesSelector";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import {
  toggleShowGlobalSearchModal,
  setGlobalSearchQuery,
} from "actions/globalSearchActions";
import {
  getItemType,
  SEARCH_ITEM_TYPES,
  useDefaultDocumentationResults,
  DocSearchItem,
  SearchItem,
  algoliaHighlightTag,
  attachKind,
} from "./utils";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { HelpBaseURL } from "constants/HelpConstants";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { BUILDER_PAGE_URL, DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { getSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getPageList } from "selectors/editorSelectors";
import useRecentEntities from "./useRecentEntities";
import { keyBy, noop } from "lodash";
import EntitiesIcon from "assets/icons/ads/entities.svg";
import DocsIcon from "assets/icons/ads/docs.svg";
import RecentIcon from "assets/icons/ads/recent.svg";
import Footer from "./Footer";

import { getCurrentPageId } from "selectors/editorSelectors";

const StyledContainer = styled.div`
  width: 750px;
  height: 60vh;
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  box-shadow: ${(props) => props.theme.colors.globalSearch.containerShadow};
  display: flex;
  flex-direction: column;
  & .main {
    display: flex;
    flex: 1;
    overflow: hidden;
    background-color: #383838;
  }
  ${algoliaHighlightTag},
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background-color: #6287b0;
    font-style: normal;
  }
`;

const Separator = styled.div`
  margin: ${(props) => props.theme.spaces[3]}px 0;
  width: 1px;
  background-color: ${(props) => props.theme.colors.globalSearch.separator};
`;

const isModalOpenSelector = (state: AppState) =>
  state.ui.globalSearch.modalOpen;

const searchQuerySelector = (state: AppState) => state.ui.globalSearch.query;

const isMatching = (text = "", query = "") =>
  text?.toLowerCase().indexOf(query?.toLowerCase()) > -1;

const getSectionTitle = (title: string, icon: any) => ({
  kind: SEARCH_ITEM_TYPES.sectionTitle,
  title,
  icon,
});

const getIsInCurrentPage = (
  isWidget: boolean,
  entity: any,
  currentPageId?: string,
) =>
  isWidget
    ? entity.pageId === currentPageId
    : entity?.config?.pageId === currentPageId;

const sortActionsAndWidgets = (a: any, b: any, currentPageId?: string) => {
  const isAWidget = !!a.widgetId;
  const isBWidget = !!b.widgetId;

  const aInCurrentPage = getIsInCurrentPage(isAWidget, a, currentPageId);
  const bInCurrentPage = getIsInCurrentPage(isBWidget, b, currentPageId);

  // page entites on top
  if (aInCurrentPage && !bInCurrentPage) return -1;
  if (!aInCurrentPage && bInCurrentPage) return 1;

  // actions before widgets
  if (isAWidget && !isBWidget) return 1;
  if (!isAWidget && isBWidget) return -1;

  return 0;
};

function GlobalSearch() {
  const currentPageId = useSelector(getCurrentPageId);
  const modalOpen = useSelector(isModalOpenSelector);
  const defaultDocs = useDefaultDocumentationResults(modalOpen);
  const params = useParams<ExplorerURLParams>();
  const dispatch = useDispatch();
  const toggleShow = () => {
    if (modalOpen) {
      setQuery("");
    }
    dispatch(toggleShowGlobalSearchModal());
  };
  const [query, setQueryInState] = useState("");
  const setQuery = useCallback((query: string) => {
    setQueryInState(query);
  }, []);
  const scrollPositionRef = useRef(0);

  const [
    documentationSearchResults,
    setDocumentationSearchResultsInState,
  ] = useState<Array<DocSearchItem>>([]);

  const setDocumentationSearchResults = useCallback((res) => {
    setDocumentationSearchResultsInState(res);
  }, []);

  const [activeItemIndex, setActiveItemIndexInState] = useState(1);
  const setActiveItemIndex = useCallback((index) => {
    scrollPositionRef.current = 0;
    setActiveItemIndexInState(index);
  }, []);

  const allWidgets = useSelector(getAllPageWidgets);

  const searchableWidgets = useMemo(
    () =>
      allWidgets.filter(
        (widget: any) =>
          ["CANVAS_WIDGET", "ICON_WIDGET"].indexOf(widget.type) === -1,
      ),
    [allWidgets],
  );
  const actions = useSelector(getActions);
  const pages = useSelector(getPageList) || [];
  const pageMap = keyBy(pages, "pageId");

  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  const datasourcesList = useMemo(() => {
    return reducerDatasources.map((datasource) => ({
      ...datasource,
      pageId: params?.pageId,
    }));
  }, [reducerDatasources]);

  const filteredDatasources = useMemo(() => {
    if (!query) return datasourcesList;
    return datasourcesList.filter((datasource) =>
      isMatching(datasource.name, query),
    );
  }, [reducerDatasources, query]);
  const recentEntities = useRecentEntities();

  const resetSearchQuery = useSelector(searchQuerySelector);
  const selectedWidgetId = useSelector(getSelectedWidget);

  // keeping query in component state until we can figure out fixed for the perf issues
  // this is used to update query from outside the component, for ex. using the help button within prop. pane
  useEffect(() => {
    if (modalOpen && resetSearchQuery) {
      setQuery(resetSearchQuery);
    } else {
      dispatch(setGlobalSearchQuery(""));
      if (!query)
        recentEntities.length > 1
          ? setActiveItemIndex(2)
          : setActiveItemIndex(1);
    }
  }, [modalOpen]);

  useEffect(() => {
    !query && recentEntities.length > 1
      ? setActiveItemIndex(2)
      : setActiveItemIndex(1);
  }, [query, recentEntities.length]);

  const filteredWidgets = useMemo(() => {
    if (!query) return searchableWidgets;

    return searchableWidgets.filter((widget: any) => {
      const page = pageMap[widget.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isWidgetNameMatching = isMatching(widget?.widgetName, query);

      return isWidgetNameMatching || isPageNameMatching;
    });
  }, [allWidgets, query]);
  const filteredActions = useMemo(() => {
    if (!query) return actions;

    return actions.filter((action: any) => {
      const page = pageMap[action?.config?.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isActionNameMatching = isMatching(action?.config?.name, query);

      return isActionNameMatching || isPageNameMatching;
    });
  }, [actions, query]);
  const filteredPages = useMemo(() => {
    if (!query) return attachKind(pages, SEARCH_ITEM_TYPES.page);

    return attachKind(
      pages.filter(
        (page: any) =>
          page.pageName.toLowerCase().indexOf(query?.toLowerCase()) > -1,
      ),
      SEARCH_ITEM_TYPES.page,
    );
  }, [pages, query]);

  const recentsSectionTitle = getSectionTitle("Recent Entities", RecentIcon);
  const docsSectionTitle = getSectionTitle("Documentation Links", DocsIcon);
  const entitiesSectionTitle = getSectionTitle("Entities", EntitiesIcon);

  const searchResults = useMemo(() => {
    if (!query) {
      return [
        recentsSectionTitle,
        ...(recentEntities.length > 0
          ? recentEntities
          : [
              {
                title: "Recents list is empty",
                kind: SEARCH_ITEM_TYPES.placeholder,
              },
            ]),
        docsSectionTitle,
        ...defaultDocs,
      ];
    }

    const results = [];

    const actionsAndWidgetsSorted = [
      ...filteredActions,
      ...filteredWidgets,
    ].sort((a, b) => sortActionsAndWidgets(a, b, currentPageId));

    const entities = [
      entitiesSectionTitle,
      ...actionsAndWidgetsSorted,
      ...filteredPages,
      ...filteredDatasources,
    ];

    if (entities.length > 1) {
      results.push(...entities);
    }

    if (documentationSearchResults.length > 0) {
      results.push(docsSectionTitle, ...documentationSearchResults);
    }

    return results;
  }, [
    filteredWidgets,
    filteredActions,
    documentationSearchResults,
    filteredDatasources,
    query,
    recentEntities,
  ]);

  const activeItem = useMemo(() => {
    return searchResults[activeItemIndex] || {};
  }, [searchResults, activeItemIndex]);

  const getNextActiveItem = (nextIndex: number) => {
    const max = Math.max(searchResults.length - 1, 0);
    if (nextIndex < 0) return max;
    else if (nextIndex > max) return 0;
    else return nextIndex;
  };

  const handleUpKey = () => {
    let nextIndex = getNextActiveItem(activeItemIndex - 1);
    const activeItem = searchResults[nextIndex];
    if (
      activeItem &&
      (activeItem?.kind === SEARCH_ITEM_TYPES.sectionTitle ||
        activeItem?.kind === SEARCH_ITEM_TYPES.placeholder)
    ) {
      nextIndex = getNextActiveItem(nextIndex - 1);
    }
    setActiveItemIndex(nextIndex);
  };

  const handleDownKey = () => {
    let nextIndex = getNextActiveItem(activeItemIndex + 1);
    const activeItem = searchResults[nextIndex];
    if (
      activeItem &&
      (activeItem?.kind === SEARCH_ITEM_TYPES.sectionTitle ||
        activeItem?.kind === SEARCH_ITEM_TYPES.placeholder)
    ) {
      nextIndex = getNextActiveItem(nextIndex + 1);
    }
    setActiveItemIndex(nextIndex);
  };

  const { navigateToWidget } = useNavigateToWidget();

  const handleDocumentationItemClick = (item: SearchItem) => {
    window.open(item.path.replace("master", HelpBaseURL), "_blank");
  };

  const handleWidgetClick = (activeItem: SearchItem) => {
    toggleShow();
    navigateToWidget(
      activeItem.widgetId,
      activeItem.type,
      activeItem.pageId,
      selectedWidgetId === activeItem.widgetId,
      activeItem.parentModalId,
    );
  };

  const handleActionClick = (item: SearchItem) => {
    const { config } = item;
    const { id, pageId, pluginType } = config;
    const actionConfig = getActionConfig(pluginType);
    const url = actionConfig?.getURL(
      params.applicationId,
      pageId,
      id,
      pluginType,
    );
    toggleShow();
    url && history.push(url);
  };

  const handleDatasourceClick = (item: SearchItem) => {
    toggleShow();
    history.push(
      DATA_SOURCES_EDITOR_ID_URL(params.applicationId, item.pageId, item.id),
    );
  };

  const handlePageClick = (item: SearchItem) => {
    toggleShow();
    history.push(BUILDER_PAGE_URL(params.applicationId, item.pageId));
  };

  const itemClickHandlerByType = {
    [SEARCH_ITEM_TYPES.document]: handleDocumentationItemClick,
    [SEARCH_ITEM_TYPES.widget]: handleWidgetClick,
    [SEARCH_ITEM_TYPES.action]: handleActionClick,
    [SEARCH_ITEM_TYPES.datasource]: handleDatasourceClick,
    [SEARCH_ITEM_TYPES.page]: handlePageClick,
    [SEARCH_ITEM_TYPES.sectionTitle]: noop,
    [SEARCH_ITEM_TYPES.placeholder]: noop,
  };

  const handleItemLinkClick = (itemArg?: SearchItem, source?: string) => {
    const item = itemArg || activeItem;
    const type = getItemType(item) as SEARCH_ITEM_TYPES;

    AnalyticsUtil.logEvent("NAVIGATE_TO_ENTITY_FROM_OMNIBAR", {
      type,
      source,
    });

    itemClickHandlerByType[type](item);
  };

  const searchContext = {
    handleItemLinkClick,
    setActiveItemIndex,
    activeItemIndex,
  };

  const hotKeyProps = {
    modalOpen,
    toggleShow,
    handleUpKey,
    handleDownKey,
    handleItemLinkClick,
  };

  const activeItemType = useMemo(() => {
    return activeItem ? getItemType(activeItem) : undefined;
  }, [activeItem]);

  return (
    <SearchContext.Provider value={searchContext}>
      <GlobalSearchHotKeys {...hotKeyProps}>
        <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
          <AlgoliaSearchWrapper query={query}>
            <StyledContainer>
              <SearchBox query={query} setQuery={setQuery} />
              <div className="main">
                <SetSearchResults
                  setDocumentationSearchResults={setDocumentationSearchResults}
                />
                {searchResults.length > 0 ? (
                  <>
                    <SearchResults
                      query={query}
                      searchResults={searchResults}
                    />
                    <Separator />
                    <Description
                      activeItem={activeItem}
                      activeItemType={activeItemType}
                      query={query}
                      scrollPositionRef={scrollPositionRef}
                    />
                  </>
                ) : (
                  <ResultsNotFound />
                )}
              </div>
              {!query && <Footer />}
            </StyledContainer>
          </AlgoliaSearchWrapper>
        </SearchModal>
      </GlobalSearchHotKeys>
    </SearchContext.Provider>
  );
}

export default GlobalSearch;
