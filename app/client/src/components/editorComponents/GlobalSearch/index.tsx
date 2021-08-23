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
  setGlobalSearchFilterContext,
  cancelSnippet,
  insertSnippet,
} from "actions/globalSearchActions";
import {
  getItemType,
  getItemTitle,
  getItemPage,
  SEARCH_ITEM_TYPES,
  useDefaultDocumentationResults,
  DocSearchItem,
  SearchItem,
  algoliaHighlightTag,
  attachKind,
  SEARCH_CATEGORY_ID,
  getEntityId,
  filterCategories,
  getFilterCategoryList,
  SearchCategory,
  isNavigation,
  isMenu,
  isSnippet,
  isDocumentation,
  SelectEvent,
} from "./utils";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { HelpBaseURL } from "constants/HelpConstants";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import { BUILDER_PAGE_URL, DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import { getSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getPageList } from "selectors/editorSelectors";
import useRecentEntities from "./useRecentEntities";
import { get, keyBy, noop } from "lodash";
import Footer from "./Footer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import SnippetsFilter from "./SnippetsFilter";
import SnippetRefinements from "./SnippetRefinements";
import { Index } from "react-instantsearch-dom";

const StyledContainer = styled.div`
  width: 785px;
  height: 530px;
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  box-shadow: ${(props) => props.theme.colors.globalSearch.containerShadow};
  display: flex;
  flex-direction: column;
  & .main {
    display: flex;
    flex: 1;
    overflow: hidden;
    background-color: ${(props) =>
      props.theme.colors.globalSearch.mainContainerBackground};
    padding: ${(props) => props.theme.spaces[4]}px
      ${(props) => props.theme.spaces[7]}px;
  }
  ${algoliaHighlightTag},
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background-color: transparent;
    font-style: normal;
    font-weight: bold;
  }
`;

const isModalOpenSelector = (state: AppState) =>
  state.ui.globalSearch.modalOpen;

const searchQuerySelector = (state: AppState) => state.ui.globalSearch.query;

const isMatching = (text = "", query = "") =>
  text?.toLowerCase().indexOf(query?.toLowerCase()) > -1;

const getQueryIndexForSorting = (item: SearchItem, query: string) => {
  if (item.kind === SEARCH_ITEM_TYPES.document) {
    const title = item?._highlightResult?.title?.value;
    return title.indexOf(algoliaHighlightTag);
  } else {
    const title = getItemTitle(item) || "";
    return title.toLowerCase().indexOf(query.toLowerCase());
  }
};

const getSortedResults = (
  query: string,
  filteredEntities: Array<any>,
  documentationSearchResults: Array<any>,
  recentEntityIndex: (entity: any) => number,
  snippets: Array<any>,
  currentPageId?: string,
) => {
  return [...filteredEntities, ...documentationSearchResults, ...snippets].sort(
    (a: any, b: any) => {
      const queryIndexA = getQueryIndexForSorting(a, query);
      const queryIndexB = getQueryIndexForSorting(b, query);

      if (queryIndexA === queryIndexB) {
        const idxA = recentEntityIndex(a);
        const idxB = recentEntityIndex(b);
        if (idxA > -1 && idxB > -1) return idxA - idxB;
        if (idxA > -1) return -1;
        else if (idxB > -1) return 1;
        const pageA = getItemPage(a);
        const pageB = getItemPage(b);
        const isAInCurrentPage = pageA === currentPageId;
        const isBInCurrentPage = pageB === currentPageId;
        if (isAInCurrentPage) return -1;
        if (isBInCurrentPage) return 1;
        return 0;
      } else {
        if (queryIndexA === -1 && queryIndexB !== -1) return 1;
        else if (queryIndexB === -1 && queryIndexA !== -1) return -1;
        else return queryIndexA - queryIndexB;
      }
    },
  );
};

const filterCategoryList = getFilterCategoryList();

function GlobalSearch() {
  const currentPageId = useSelector(getCurrentPageId);
  const modalOpen = useSelector(isModalOpenSelector);
  const dispatch = useDispatch();
  const [snippets, setSnippetsState] = useState([]);
  const category = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.category,
  );
  const setCategory = (category: SearchCategory) =>
    dispatch(setGlobalSearchFilterContext({ category: category }));
  const setRefinements = (entityMeta: any) =>
    dispatch(setGlobalSearchFilterContext({ refinements: entityMeta }));
  const refinements = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.refinements,
  );
  const defaultDocs = useDefaultDocumentationResults(modalOpen);
  const params = useParams<ExplorerURLParams>();
  const toggleShow = () => {
    if (modalOpen) {
      setQuery("");
      setCategory(filterCategories[SEARCH_CATEGORY_ID.DOCUMENTATION]);
    }
    dispatch(toggleShowGlobalSearchModal());
    dispatch(cancelSnippet());
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

  const [activeItemIndex, setActiveItemIndexInState] = useState(0);
  const setActiveItemIndex = useCallback((index) => {
    scrollPositionRef.current = 0;
    setActiveItemIndexInState(index);
  }, []);

  useEffect(() => {
    setTimeout(() => document.getElementById("global-search")?.focus());
    if (isNavigation(category) && recentEntities.length > 1) {
      setActiveItemIndex(1);
    } else {
      setActiveItemIndex(0);
    }
  }, [category.id]);

  useEffect(() => {
    setActiveItemIndex(0);
  }, [refinements]);

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
  const recentEntityIds = recentEntities
    .map((r) => getEntityId(r))
    .filter(Boolean);
  const recentEntityIndex = useCallback(
    (entity) => {
      if (entity.kind === SEARCH_ITEM_TYPES.document) return -1;
      const id =
        entity.id || entity.widgetId || entity.config?.id || entity.pageId;
      return recentEntityIds.indexOf(id);
    },
    [recentEntities],
  );

  const resetSearchQuery = useSelector(searchQuerySelector);
  const selectedWidgetId = useSelector(getSelectedWidget);

  // keeping query in component state until we can figure out fixed for the perf issues
  // this is used to update query from outside the component, for ex. using the help button within prop. pane
  useEffect(() => {
    if (modalOpen && resetSearchQuery) {
      setQuery(resetSearchQuery);
    } else {
      dispatch(setGlobalSearchQuery(""));
    }
  }, [modalOpen]);

  useEffect(() => {
    if (query) setActiveItemIndex(0);
  }, [query]);

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

  const searchResults = useMemo(() => {
    if (isMenu(category) && !query) {
      return filterCategoryList.filter((cat: SearchCategory) => !isMenu(cat));
    }
    if (isSnippet(category)) {
      return snippets;
    }

    let currentSnippets = snippets;
    let filteredEntities: any = [];
    let documents: DocSearchItem[] = [];
    if (isNavigation(category) || isMenu(category)) {
      filteredEntities = [
        ...filteredActions,
        ...filteredWidgets,
        ...filteredPages,
        ...filteredDatasources,
      ];
    }
    if (isDocumentation(category) || isMenu(category)) {
      documents = query
        ? documentationSearchResults
        : defaultDocs.concat(documentationSearchResults);
    }
    if (!(isSnippet(category) || isMenu(category))) {
      currentSnippets = [];
    }

    return getSortedResults(
      query,
      filteredEntities,
      documents,
      recentEntityIndex,
      currentSnippets,
      currentPageId,
    );
  }, [
    filteredWidgets,
    filteredActions,
    documentationSearchResults,
    filteredDatasources,
    query,
    recentEntities,
    snippets,
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
      DATA_SOURCES_EDITOR_ID_URL(
        params.applicationId,
        item.pageId,
        item.id,
        getQueryParams(),
      ),
    );
  };

  const handlePageClick = (item: SearchItem) => {
    toggleShow();
    history.push(BUILDER_PAGE_URL(params.applicationId, item.pageId));
  };

  const handleSnippetClick = (event: SelectEvent, item: any) => {
    if (event.type === "click") {
      setActiveItemIndex(
        searchResults.findIndex((snip: any) => snip.objectID === item.objectID),
      );
      return;
    }
    dispatch(insertSnippet(get(item, "body.examples[0].code", "")));
    toggleShow();
  };

  const itemClickHandlerByType = {
    [SEARCH_ITEM_TYPES.document]: (e: SelectEvent, item: any) =>
      handleDocumentationItemClick(item),
    [SEARCH_ITEM_TYPES.widget]: (e: SelectEvent, item: any) =>
      handleWidgetClick(item),
    [SEARCH_ITEM_TYPES.action]: (e: SelectEvent, item: any) =>
      handleActionClick(item),
    [SEARCH_ITEM_TYPES.datasource]: (e: SelectEvent, item: any) =>
      handleDatasourceClick(item),
    [SEARCH_ITEM_TYPES.page]: (e: SelectEvent, item: any) =>
      handlePageClick(item),
    [SEARCH_ITEM_TYPES.sectionTitle]: noop,
    [SEARCH_ITEM_TYPES.placeholder]: noop,
    [SEARCH_ITEM_TYPES.category]: (e: SelectEvent, item: any) =>
      setCategory(item),
    [SEARCH_ITEM_TYPES.snippet]: (e: SelectEvent, item: any) =>
      handleSnippetClick(e, item),
  };

  const handleItemLinkClick = (
    event: SelectEvent,
    itemArg?: SearchItem,
    source?: string,
  ) => {
    const item = itemArg || activeItem;
    const type = getItemType(item) as SEARCH_ITEM_TYPES;

    AnalyticsUtil.logEvent("NAVIGATE_TO_ENTITY_FROM_OMNIBAR", {
      type,
      source,
    });
    itemClickHandlerByType[type](event, item);
  };

  const setSearchResults = useCallback((res, category) => {
    if (isSnippet(category)) {
      setSnippetsState(res);
    } else {
      setDocumentationSearchResultsInState(res);
    }
  }, []);

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

  const showDescription = useMemo(() => {
    return (
      isDocumentation(category) ||
      isSnippet(category) ||
      (isMenu(category) && query)
    );
  }, [category, query]);

  const activeItemType = useMemo(() => {
    return activeItem ? getItemType(activeItem) : undefined;
  }, [activeItem]);

  return (
    <SearchContext.Provider value={searchContext}>
      <GlobalSearchHotKeys {...hotKeyProps}>
        <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
          <AlgoliaSearchWrapper
            category={category}
            query={query}
            refinements={refinements}
            setRefinement={setRefinements}
          >
            <StyledContainer>
              <SearchBox
                category={category}
                query={query}
                setCategory={setCategory}
                setQuery={setQuery}
              />
              {refinements &&
                refinements.entities &&
                refinements.entities.length && <SnippetRefinements />}
              <div className="main">
                <SetSearchResults
                  category={category}
                  setSearchResults={setSearchResults}
                />
                {isMenu(category) && (
                  <Index indexName="snippet">
                    <SetSearchResults
                      category={category}
                      setSearchResults={setSnippetsState}
                    />
                  </Index>
                )}
                {searchResults.length > 0 ? (
                  <>
                    <SearchResults
                      query={query}
                      refinements={refinements}
                      searchResults={searchResults}
                      showFilter={isSnippet(category)}
                    />
                    {showDescription && (
                      <Description
                        activeItem={activeItem}
                        activeItemType={activeItemType}
                        query={query}
                        scrollPositionRef={scrollPositionRef}
                      />
                    )}
                  </>
                ) : (
                  <ResultsNotFound />
                )}
                {isSnippet(category) && (
                  <SnippetsFilter
                    refinements={refinements}
                    snippetsEmpty={snippets.length === 0}
                  />
                )}
              </div>
              <Footer />
            </StyledContainer>
          </AlgoliaSearchWrapper>
        </SearchModal>
      </GlobalSearchHotKeys>
    </SearchContext.Provider>
  );
}

export default GlobalSearch;
