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
  SEARCH_CATEGORIES,
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
import Footer from "./Footer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { RefinementList } from "react-instantsearch-dom";

const filterCategories = [
  {
    title: "Navigate",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORIES.NAVIGATION,
    desc: "Navigate to any page, widget or file across this project.",
  },
  {
    title: "Use Snippets",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORIES.SNIPPETS,
    desc: "Search and Insert code snippets to perform complex actions quickly.",
  },
  {
    title: "Search Documentation",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORIES.DOCUMENTATION,
    desc: "Search and Insert code snippets to perform complex actions quickly.",
  },
];

const isNavigation = (category: any) =>
  category.id === SEARCH_CATEGORIES.NAVIGATION;
const isDocumentation = (category: any) =>
  category.id === SEARCH_CATEGORIES.DOCUMENTATION;
const isSnippet = (category: any) => category.id === SEARCH_CATEGORIES.SNIPPETS;
const isMenu = (category: any) => category.id === SEARCH_CATEGORIES.INIT;

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

const SnippetsFilter = styled.div<{ showFilter: boolean }>`
  position: absolute;
  bottom: 50px;
  left: 90px;
  height: 32px;
  width: 75px;
  button {
    background: #fafafa;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 400;
    color: #716e6e;
    border: 1px solid #f1f1f1;
    box-shadow: 0 0 5px #fafafa;
    height: 100%;
    width: 100%;
    cursor: pointer;
    position: relative;
  }
  .filter-list {
    display: ${(props) => (props.showFilter ? "block" : "none")};
    position: absolute;
    width: 185px;
    height: 185px;
    bottom: 40px;
    right: -58px;
    padding: 7px 15px;
    overflow: auto;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    box-shadow: 0 0 5px #f0f0f0;
    [class^="ais-"] {
      font-size: 12px;
    }
    .ais-RefinementList-list {
      text-align: left;
      .ais-RefinementList-item {
        font-size: 12px;
        .ais-RefinementList-label {
          display: flex;
          align-items: center;
          .ais-RefinementList-labelText {
            margin: 0 10px;
          }
        }
      }
    }
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
  currentPageId?: string,
) => {
  return [...filteredEntities, ...documentationSearchResults].sort(
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
  const [category, setCategory] = useState({ id: SEARCH_CATEGORIES.INIT });
  const [snippets, setSnippetsState] = useState([]);
  const initCategoryId = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.category,
  );
  useEffect(() => {
    const triggeredCategory = filterCategories.find(
      (c) => c.id === initCategoryId,
    );
    if (triggeredCategory) setCategory(triggeredCategory);
    return () => {
      dispatch(
        setGlobalSearchFilterContext({ category: SEARCH_CATEGORIES.INIT }),
      );
    };
  }, [initCategoryId]);
  const defaultDocs = useDefaultDocumentationResults(modalOpen);
  const params = useParams<ExplorerURLParams>();
  const toggleShow = () => {
    if (modalOpen) {
      setQuery("");
      setCategory({ id: SEARCH_CATEGORIES.INIT });
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

  const setSearchResults = useCallback((res, categoryId) => {
    if (categoryId === SEARCH_CATEGORIES.SNIPPETS) setSnippetsState(res);
    else setDocumentationSearchResultsInState(res);
  }, []);

  const [activeItemIndex, setActiveItemIndexInState] = useState(0);
  const setActiveItemIndex = useCallback((index) => {
    scrollPositionRef.current = 0;
    setActiveItemIndexInState(index);
  }, []);

  useEffect(() => {
    setTimeout(() => document.getElementById("global-search")?.focus());
    if (isNavigation(category)) setActiveItemIndex(1);
    else setActiveItemIndex(0);
  }, [category.id]);

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
    .map((r) => r.id || r.widgetId || r.config?.id || r.pageId)
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
    if (query) {
      setActiveItemIndex(0);
    } else {
      if (recentEntities.length > 1) {
        setActiveItemIndex(2);
      } else {
        setActiveItemIndex(1);
      }
    }
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

  const searchResults = useMemo(() => {
    if (category.id === SEARCH_CATEGORIES.INIT && !query) {
      return filterCategories;
    }
    if (category.id === SEARCH_CATEGORIES.SNIPPETS) {
      return snippets;
    }

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

    return getSortedResults(
      query,
      filteredEntities,
      documents,
      recentEntityIndex,
      currentPageId,
    );
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

  const handleSnippetClick = (item: any) => {
    dispatch(insertSnippet(item.snippet));
    toggleShow();
  };

  const itemClickHandlerByType = {
    [SEARCH_ITEM_TYPES.document]: handleDocumentationItemClick,
    [SEARCH_ITEM_TYPES.widget]: handleWidgetClick,
    [SEARCH_ITEM_TYPES.action]: handleActionClick,
    [SEARCH_ITEM_TYPES.datasource]: handleDatasourceClick,
    [SEARCH_ITEM_TYPES.page]: handlePageClick,
    [SEARCH_ITEM_TYPES.sectionTitle]: noop,
    [SEARCH_ITEM_TYPES.placeholder]: noop,
    [SEARCH_ITEM_TYPES.category]: setCategory,
    [SEARCH_ITEM_TYPES.snippet]: handleSnippetClick,
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

  const [showSnippetFilter, toggleSnippetFilter] = useState(false);

  const [refinements, setRefinements] = useState([]);

  const activeItemType = useMemo(() => {
    return activeItem ? getItemType(activeItem) : undefined;
  }, [activeItem]);

  return (
    <SearchContext.Provider value={searchContext}>
      <GlobalSearchHotKeys {...hotKeyProps}>
        <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
          <AlgoliaSearchWrapper
            query={query}
            refinementList={refinements}
            setRefinement={setRefinements}
          >
            <StyledContainer>
              {/* <Configure filters="entities:table" /> */}
              {category.id === SEARCH_CATEGORIES.SNIPPETS && (
                <SnippetsFilter showFilter={showSnippetFilter}>
                  <button
                    onClick={() => toggleSnippetFilter(!showSnippetFilter)}
                  >
                    1 Filter
                  </button>
                  <div className="filter-list">
                    <RefinementList
                      attribute="entities"
                      defaultRefinement={refinements}
                    />
                  </div>
                </SnippetsFilter>
              )}
              <SearchBox
                category={category}
                query={query}
                setCategory={setCategory}
                setQuery={setQuery}
              />
              <div className="main">
                <SetSearchResults
                  categoryId={category.id}
                  setDocumentationSearchResults={setSearchResults}
                />
                {searchResults.length > 0 ? (
                  <>
                    <SearchResults
                      query={query}
                      searchResults={searchResults}
                    />
                    {isDocumentation(category) ||
                      (isSnippet(category) && (
                        <Description
                          activeItem={activeItem}
                          activeItemType={activeItemType}
                          query={query}
                          scrollPositionRef={scrollPositionRef}
                        />
                      ))}
                  </>
                ) : (
                  <ResultsNotFound />
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
