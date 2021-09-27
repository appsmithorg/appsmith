import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { ThemeProvider } from "styled-components";
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
import {
  getActions,
  getAllPageWidgets,
  getJSCollections,
} from "selectors/entitiesSelector";
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
  getOptionalFilters,
} from "./utils";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { HelpBaseURL } from "constants/HelpConstants";
import { ExplorerURLParams } from "pages/Editor/Explorer/helpers";
import {
  BUILDER_PAGE_URL,
  DATA_SOURCES_EDITOR_ID_URL,
  JS_COLLECTION_ID_URL,
} from "constants/routes";
import { getSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getPageList } from "selectors/editorSelectors";
import useRecentEntities from "./useRecentEntities";
import { get, keyBy, noop } from "lodash";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import SnippetsFilter from "./SnippetsFilter";
import SnippetRefinements from "./SnippetRefinements";
import { Configure, Index } from "react-instantsearch-dom";
import { getAppsmithConfigs } from "configs";
import { lightTheme } from "selectors/themeSelectors";
import { SnippetAction } from "reducers/uiReducers/globalSearchReducer";
import copy from "copy-to-clipboard";
import { getSnippet } from "./SnippetsDescription";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";

const StyledContainer = styled.div<{ category: SearchCategory }>`
  width: 785px;
  max-height: 530px;
  height: ${(props) => (isMenu(props.category) ? "auto" : "530px")};
  background: ${(props) => props.theme.colors.globalSearch.primaryBgColor};
  display: flex;
  padding: ${(props) => props.theme.spaces[5]}px;
  flex-direction: column;
  position: relative;
  & .main {
    display: flex;
    flex: 1;
    margin-top: ${(props) => props.theme.spaces[4]}px;
    overflow: hidden;
    background-color: ${(props) =>
      props.theme.colors.globalSearch.primaryBgColor};
  }
  ${algoliaHighlightTag},
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background-color: transparent;
    font-style: normal;
    font-weight: bold;
  }
`;

const { algolia } = getAppsmithConfigs();

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

function GlobalSearch() {
  const currentPageId = useSelector(getCurrentPageId);
  const modalOpen = useSelector(isModalOpenSelector);
  const dispatch = useDispatch();
  const [snippets, setSnippetsState] = useState([]);
  const optionalFilterMeta = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.fieldMeta,
  );
  const filterCategoryList = getFilterCategoryList();
  const category = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.category,
  );
  const setCategory = useCallback(
    (category: SearchCategory) => {
      if (isSnippet(category)) {
        AnalyticsUtil.logEvent("SNIPPET_CATEGORY_CLICK");
      }
      dispatch(setGlobalSearchFilterContext({ category: category }));
    },
    [dispatch, isSnippet, setGlobalSearchFilterContext],
  );
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
  const jsActions = useSelector(getJSCollections);
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
  const filteredJSCollections = useMemo(() => {
    if (!query) return jsActions;

    return jsActions.filter((action: any) => {
      const page = pageMap[action?.config?.pageId];
      const isPageNameMatching = isMatching(page?.pageName, query);
      const isActionNameMatching = isMatching(action?.config?.name, query);

      return isActionNameMatching || isPageNameMatching;
    });
  }, [jsActions, query]);
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
        ...filteredJSCollections,
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
    if (isNavigation(category) || isDocumentation(category)) {
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
    filteredJSCollections,
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

  const handleDocumentationItemClick = (
    item: SearchItem,
    event?: SelectEvent,
  ) => {
    if (event && event.type === "click") return;
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

  const handleJSCollectionClick = (item: SearchItem) => {
    const { config } = item;
    const { id, pageId } = config;
    history.push(JS_COLLECTION_ID_URL(params.applicationId, pageId, id));
    toggleShow();
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

  const onEnterSnippet = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.onEnter,
  );

  const handleSnippetClick = (event: SelectEvent, item: any) => {
    if (event && event.type === "click") return;
    const snippetExecuteBtn = document.querySelector(
      ".snippet-execute",
    ) as HTMLButtonElement;
    if (snippetExecuteBtn && !snippetExecuteBtn.disabled) {
      return snippetExecuteBtn && snippetExecuteBtn.click();
    }
    if (onEnterSnippet === SnippetAction.INSERT) {
      dispatch(insertSnippet(get(item, "body.snippet", "")));
    } else {
      const snippet = getSnippet(get(item, "body.snippet", ""), {});
      const title = get(item, "body.title", "");
      copy(snippet);
      Toaster.show({
        text: "Snippet copied to clipboard",
        variant: Variant.success,
      });
      AnalyticsUtil.logEvent("SNIPPET_COPIED", { snippet, title });
    }
    toggleShow();
  };

  const itemClickHandlerByType = {
    [SEARCH_ITEM_TYPES.document]: (e: SelectEvent, item: any) =>
      handleDocumentationItemClick(item, e),
    [SEARCH_ITEM_TYPES.widget]: (e: SelectEvent, item: any) =>
      handleWidgetClick(item),
    [SEARCH_ITEM_TYPES.action]: (e: SelectEvent, item: any) =>
      handleActionClick(item),
    [SEARCH_ITEM_TYPES.datasource]: (e: SelectEvent, item: any) =>
      handleDatasourceClick(item),
    [SEARCH_ITEM_TYPES.page]: (e: SelectEvent, item: any) =>
      handlePageClick(item),
    [SEARCH_ITEM_TYPES.jsAction]: (e: SelectEvent, item: any) =>
      handleJSCollectionClick(item),
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
    const type = getItemType(item);

    // When there is no active item(or no search results) do nothing
    // on pressing enter
    if (!searchResults.length) return;

    AnalyticsUtil.logEvent("NAVIGATE_TO_ENTITY_FROM_OMNIBAR", {
      type,
      source,
    });
    itemClickHandlerByType[type](event, item);
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
    <ThemeProvider theme={lightTheme}>
      <SearchContext.Provider value={searchContext}>
        <GlobalSearchHotKeys {...hotKeyProps}>
          <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
            <AlgoliaSearchWrapper
              category={category}
              query={query}
              refinements={refinements}
              setRefinement={setRefinements}
            >
              <StyledContainer category={category}>
                <SearchBox
                  category={category}
                  query={query}
                  setCategory={setCategory}
                  setQuery={setQuery}
                />
                {isSnippet(category) &&
                  refinements &&
                  refinements.entities &&
                  refinements.entities.length && <SnippetRefinements />}
                <div className="main">
                  {(isMenu(category) || isDocumentation(category)) && (
                    <Index indexName={algolia.indexName}>
                      <SetSearchResults
                        category={category}
                        setSearchResults={setDocumentationSearchResultsInState}
                      />
                    </Index>
                  )}
                  {/* Search from default menu should search multiple indexes.
                Below is the code to search in the index-snippet. Index
                component requires Hits component as its children to display the
                results. SetSearchResults is the custom hits component. */}
                  {(isMenu(category) || isSnippet(category)) && (
                    <Index indexName="snippet">
                      <Configure
                        optionalFilters={getOptionalFilters(optionalFilterMeta)}
                      />
                      <SetSearchResults
                        category={category}
                        setSearchResults={setSnippetsState}
                      />
                    </Index>
                  )}
                  {searchResults.length > 0 ? (
                    <>
                      <SearchResults
                        category={category}
                        query={query}
                        searchResults={searchResults}
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
                {/* <Footer /> */}
              </StyledContainer>
            </AlgoliaSearchWrapper>
          </SearchModal>
        </GlobalSearchHotKeys>
      </SearchContext.Provider>
    </ThemeProvider>
  );
}

export default GlobalSearch;
