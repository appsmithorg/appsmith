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
import DocsIcon from "assets/icons/ads/docs.svg";
// import RecentIcon from "assets/icons/ads/recent.svg";
import Footer from "./Footer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getQueryParams } from "../../../utils/AppsmithUtils";
import { Configure } from "react-instantsearch-dom";

export enum SEARCH_CATEGORIES {
  SNIPPETS = "Snippets",
  DOCUMENTATION = "Documentation",
  NAVIGATION = "Navigate",
  INIT = "",
}

const filterCategories = [
  {
    title: "Navigate",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORIES.NAVIGATION,
    desc: "Navigate to any page, widget or file across this project.",
  },
  // {
  //   title: "Use Snippets",
  //   kind: SEARCH_ITEM_TYPES.category,
  //   id: SEARCH_CATEGORIES.SNIPPETS,
  //   desc: "Search and Insert code snippets to perform complex actions quickly.",
  // },
  {
    title: "Search Documentation",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORIES.DOCUMENTATION,
    desc: "Search and Insert code snippets to perform complex actions quickly.",
  },
];

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
    background-color: #f0f0f0;
    padding: 10px 16px;
  }
  ${algoliaHighlightTag},
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background-color: transparent;
    font-style: normal;
    font-weight: bold;
    margin-right: -3px;
  }
`;

// const Separator = styled.div`
//   margin: ${(props) => props.theme.spaces[3]}px 0;
//   width: 1px;
//   background-color: ${(props) => props.theme.colors.globalSearch.separator};
// `;

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
  filteredActions: Array<any>,
  filteredWidgets: Array<any>,
  filteredPages: Array<any>,
  filteredDatasources: Array<any>,
  documentationSearchResults: Array<any>,
  currentPageId?: string,
) => {
  return [
    ...filteredActions,
    ...filteredWidgets,
    ...filteredPages,
    ...filteredDatasources,
    ...documentationSearchResults,
  ].sort((a: any, b: any) => {
    const queryIndexA = getQueryIndexForSorting(a, query);
    const queryIndexB = getQueryIndexForSorting(b, query);

    if (queryIndexA === queryIndexB) {
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
  });
};

function GlobalSearch() {
  const currentPageId = useSelector(getCurrentPageId);
  const modalOpen = useSelector(isModalOpenSelector);
  const dispatch = useDispatch();
  const [category, setCategory] = useState({ id: SEARCH_CATEGORIES.INIT });
  const [snippets, setSnippetsState] = useState([]);
  const setSnippets = useCallback((res) => {
    setSnippetsState(res);
  }, []);
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

  const setSearchResults = useCallback((res) => {
    if (category.id === SEARCH_CATEGORIES.SNIPPETS) setSnippets(res);
    else setDocumentationSearchResultsInState(res);
  }, []);

  const [activeItemIndex, setActiveItemIndexInState] = useState(0);
  const setActiveItemIndex = useCallback((index) => {
    scrollPositionRef.current = 0;
    setActiveItemIndexInState(index);
  }, []);

  useEffect(() => {
    document.getElementById("global-search")?.focus();
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

  const resetSearchQuery = useSelector(searchQuerySelector);
  const selectedWidgetId = useSelector(getSelectedWidget);

  // keeping query in component state until we can figure out fixed for the perf issues
  // this is used to update query from outside the component, for ex. using the help button within prop. pane
  useEffect(() => {
    if (modalOpen && resetSearchQuery) {
      setQuery(resetSearchQuery);
    } else {
      dispatch(setGlobalSearchQuery(""));
      if (!query) setActiveItemIndex(0);
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

  // const recentsSectionTitle = getSectionTitle("Recent Entities", RecentIcon);
  const docsSectionTitle = getSectionTitle("Documentation Links", DocsIcon);

  const searchResults = useMemo(() => {
    // if (query && category.id === SEARCH_CATEGORIES.INIT) {
    //   return [
    //     recentsSectionTitle,
    //     ...(recentEntities.length > 0
    //       ? recentEntities
    //       : [
    //           {
    //             title: "Recents list is empty",
    //             kind: SEARCH_ITEM_TYPES.placeholder,
    //           },
    //         ]),
    //     docsSectionTitle,
    //     ...defaultDocs,
    //   ];
    // }
    if (category.id === SEARCH_CATEGORIES.INIT && !query) {
      return filterCategories;
    }
    if (category.id === SEARCH_CATEGORIES.SNIPPETS) {
      return snippets;
    }

    let results: any = [];
    // if (category.id === SEARCH_CATEGORIES.NAVIGATION && !query) {
    //   results = [recentsSectionTitle, ...recentEntities];
    // }
    if (category.id === SEARCH_CATEGORIES.DOCUMENTATION && !query) {
      results = [docsSectionTitle];
    }

    return results.concat(
      getSortedResults(
        query,
        [SEARCH_CATEGORIES.NAVIGATION, SEARCH_CATEGORIES.INIT].includes(
          category.id,
        )
          ? filteredActions
          : [],
        [SEARCH_CATEGORIES.NAVIGATION, SEARCH_CATEGORIES.INIT].includes(
          category.id,
        )
          ? filteredWidgets
          : [],
        [SEARCH_CATEGORIES.NAVIGATION, SEARCH_CATEGORIES.INIT].includes(
          category.id,
        )
          ? filteredPages
          : [],
        [SEARCH_CATEGORIES.NAVIGATION, SEARCH_CATEGORIES.INIT].includes(
          category.id,
        )
          ? filteredDatasources
          : [],
        category.id === SEARCH_CATEGORIES.DOCUMENTATION
          ? query
            ? documentationSearchResults
            : defaultDocs
          : [],
        currentPageId,
      ) || [],
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

  const activeItemType = useMemo(() => {
    return activeItem ? getItemType(activeItem) : undefined;
  }, [activeItem]);

  return (
    <SearchContext.Provider value={searchContext}>
      <GlobalSearchHotKeys {...hotKeyProps}>
        <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
          <AlgoliaSearchWrapper query={query}>
            <StyledContainer>
              <Configure filters="" />
              <SearchBox
                category={category}
                query={query}
                setCategory={setCategory}
                setQuery={setQuery}
              />
              {
                <div className="main">
                  <SetSearchResults
                    setDocumentationSearchResults={setSearchResults}
                  />
                  {searchResults.length > 0 ? (
                    <>
                      <SearchResults
                        query={query}
                        searchResults={searchResults}
                      />
                      {/* {getCategoryId(category) !==
                        SEARCH_CATEGORIES.SNIPPETS && <Separator />} */}
                      {(category.id === SEARCH_CATEGORIES.DOCUMENTATION ||
                        category.id === SEARCH_CATEGORIES.SNIPPETS) && (
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
                </div>
              }
              {!query && <Footer />}
            </StyledContainer>
          </AlgoliaSearchWrapper>
        </SearchModal>
      </GlobalSearchHotKeys>
    </SearchContext.Provider>
  );
}

export default GlobalSearch;
