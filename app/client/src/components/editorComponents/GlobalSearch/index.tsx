import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import styled, { ThemeProvider } from "styled-components";
import { useParams } from "react-router";
import history, { NavigationMethod } from "utils/history";
import type { AppState } from "@appsmith/reducers";
import SearchModal from "./SearchModal";
import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";
import GlobalSearchHotKeys from "./GlobalSearchHotKeys";
import SearchContext from "./GlobalSearchContext";
import Description from "./Description";
import ResultsNotFound from "./ResultsNotFound";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import {
  setGlobalSearchFilterContext,
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import type { SearchCategory, SearchItem, SelectEvent } from "./utils";
import {
  algoliaHighlightTag,
  filterCategories,
  getEntityId,
  getFilterCategoryList,
  getItemPage,
  getItemTitle,
  getItemType,
  isActionOperation,
  isMatching,
  isMenu,
  isNavigation,
  SEARCH_CATEGORY_ID,
  SEARCH_ITEM_TYPES,
} from "./utils";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { getLastSelectedWidget } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import useRecentEntities from "./useRecentEntities";
import { noop } from "lodash";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getQueryParams } from "utils/URLUtils";
import { lightTheme } from "selectors/themeSelectors";
import {
  useFilteredActions,
  useFilteredFileOperations,
  useFilteredJSCollections,
  useFilteredPages,
  useFilteredWidgets,
} from "./GlobalSearchHooks";
import {
  builderURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
} from "RouteBuilder";
import { getPlugins } from "selectors/entitiesSelector";
import {
  DatasourceCreateEntryPoints,
  TEMP_DATASOURCE_ID,
} from "constants/Datasource";

const StyledContainer = styled.div<{ category: SearchCategory; query: string }>`
  max-height: 530px;
  transition: height 0.1s ease, width 0.1s ease;
  height: ${(props) =>
    isMenu(props.category) ||
    isActionOperation(props.category) ||
    isNavigation(props.category)
      ? "auto"
      : "530px"};
  display: flex;
  flex-direction: column;
  position: relative;

  & .main {
    display: flex;
    flex: 1;
    margin-top: 50px;
    &.main-snippet {
      margin-top: 17px;
      overflow: hidden;
    }
  }

  ${algoliaHighlightTag},
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background-color: transparent;
    font-style: normal;
    font-weight: bold;
  }
`;

export const isModalOpenSelector = (state: AppState) =>
  state.ui.globalSearch.modalOpen;

const searchQuerySelector = (state: AppState) => state.ui.globalSearch.query;

const getQueryIndexForSorting = (item: SearchItem, query: string) => {
  const title = getItemTitle(item) || "";
  return title.toLowerCase().indexOf(query.toLowerCase());
};

const getSortedResults = (
  query: string,
  filteredEntities: Array<any>,
  recentEntityIndex: (entity: any) => number,
  currentPageId?: string,
) => {
  return filteredEntities.sort((a: any, b: any) => {
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
  });
};

const filterCategoryList = getFilterCategoryList();
const emptyObj = {};
function GlobalSearch() {
  const currentPageId = useSelector(getCurrentPageId) as string;
  const modalOpen = useSelector(isModalOpenSelector);
  const dispatch = useDispatch();
  const [query, setQueryInState] = useState("");
  const setQuery = useCallback(
    (value: string) => {
      setQueryInState(value);
    },
    [setQueryInState],
  );
  const category = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.category,
  );
  const plugins = useSelector(getPlugins);
  const setCategory = useCallback(
    (category: SearchCategory) => {
      dispatch(setGlobalSearchFilterContext({ category: category }));
    },
    [dispatch],
  );
  const params = useParams<ExplorerURLParams>();

  const toggleShow = () => {
    if (modalOpen) {
      setQuery("");
      setCategory(filterCategories[SEARCH_CATEGORY_ID.INIT]);
    }
    dispatch(toggleShowGlobalSearchModal());
  };

  const scrollPositionRef = useRef(0);

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
  }, []);

  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list.filter(
      (datasource) => datasource.id !== TEMP_DATASOURCE_ID,
    );
  }, shallowEqual);
  const datasourcesList = useMemo(() => {
    return reducerDatasources.map((datasource) => ({
      ...datasource,
      pageId: params?.pageId,
    }));
  }, [params?.pageId, reducerDatasources]);

  const filteredDatasources = useMemo(() => {
    if (!query) return datasourcesList;
    return datasourcesList.filter((datasource) =>
      isMatching(datasource.name, query),
    );
  }, [datasourcesList, query]);
  const recentEntities = useRecentEntities();
  const recentEntityIds = recentEntities
    .map((r) => getEntityId(r))
    .filter(Boolean);
  const recentEntityIndex = useCallback(
    (entity: any) => {
      const id =
        entity.id || entity.widgetId || entity.config?.id || entity.pageId;
      return recentEntityIds.indexOf(id);
    },
    [recentEntityIds],
  );

  const resetSearchQuery = useSelector(searchQuerySelector);
  const lastSelectedWidgetId = useSelector(getLastSelectedWidget);

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

  const filteredWidgets = useFilteredWidgets(query);
  const filteredActions = useFilteredActions(query);
  const filteredJSCollections = useFilteredJSCollections(query);
  const filteredPages = useFilteredPages(query);
  const filteredFileOperations = useFilteredFileOperations(query);

  const searchResults = useMemo(() => {
    if (isMenu(category) && !query) {
      const shouldRemoveActionCreation = !filteredFileOperations.length;
      return filterCategoryList.filter(
        (cat: SearchCategory) =>
          !isMenu(cat) &&
          (isActionOperation(cat) ? !shouldRemoveActionCreation : true),
      );
    }
    if (isActionOperation(category)) {
      return filteredFileOperations;
    }

    let filteredEntities: any = [];

    if (isNavigation(category) || isMenu(category)) {
      filteredEntities = [
        ...filteredActions,
        ...filteredJSCollections,
        ...filteredWidgets,
        ...filteredPages,
        ...filteredDatasources,
      ];
    }

    return getSortedResults(
      query,
      filteredEntities,
      recentEntityIndex,
      currentPageId,
    );
  }, [
    category,
    currentPageId,
    filteredActions,
    filteredDatasources,
    filteredFileOperations,
    filteredJSCollections,
    filteredPages,
    filteredWidgets,
    query,
    recentEntityIndex,
  ]);

  const activeItem = useMemo(() => {
    return searchResults[activeItemIndex] || emptyObj;
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

  const handleWidgetClick = (activeItem: SearchItem) => {
    toggleShow();
    navigateToWidget(
      activeItem.widgetId,
      activeItem.type,
      activeItem.pageId,
      NavigationMethod.Omnibar,
      lastSelectedWidgetId === activeItem.widgetId,
      false,
      false,
      activeItem.pageId !== currentPageId,
    );
  };

  const handleActionClick = (item: SearchItem) => {
    const { config } = item;
    const { id, pageId, pluginId, pluginType } = config;
    const actionConfig = getActionConfig(pluginType);
    const plugin = plugins.find((plugin) => plugin?.id === pluginId);
    const url = actionConfig?.getURL(pageId, id, pluginType, plugin);
    toggleShow();
    url && history.push(url, { invokedBy: NavigationMethod.Omnibar });
  };

  const handleJSCollectionClick = (item: SearchItem) => {
    const { config } = item;
    const { id, pageId } = config;
    history.push(
      jsCollectionIdURL({
        pageId,
        collectionId: id,
      }),
      { invokedBy: NavigationMethod.Omnibar },
    );
    toggleShow();
  };

  const handleDatasourceClick = (item: SearchItem) => {
    toggleShow();
    history.push(
      datasourcesEditorIdURL({
        pageId: item.pageId,
        datasourceId: item.id,
        params: getQueryParams(),
      }),
      { invokedBy: NavigationMethod.Omnibar },
    );
  };

  const handlePageClick = (item: SearchItem) => {
    toggleShow();
    history.push(
      builderURL({
        pageId: item.pageId,
      }),
      { invokedBy: NavigationMethod.Omnibar },
    );
  };

  const itemClickHandlerByType = {
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
    [SEARCH_ITEM_TYPES.actionOperation]: (e: SelectEvent, item: any) => {
      if (item.action)
        dispatch(
          item.action(currentPageId, DatasourceCreateEntryPoints.OMNIBAR),
        );
      else if (item.redirect)
        item.redirect(currentPageId, DatasourceCreateEntryPoints.OMNIBAR);
      dispatch(toggleShowGlobalSearchModal());
    },
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
    return isMenu(category) && query;
  }, [category, query]);

  const activeItemType = useMemo(() => {
    return activeItem ? getItemType(activeItem) : undefined;
  }, [activeItem]);

  return (
    <ThemeProvider theme={lightTheme}>
      <SearchContext.Provider value={searchContext}>
        <GlobalSearchHotKeys {...hotKeyProps}>
          <SearchModal modalOpen={modalOpen} toggleShow={toggleShow}>
            <StyledContainer category={category} query={query}>
              <SearchBox
                category={category}
                query={query}
                setCategory={setCategory}
                setQuery={setQuery}
              />
              <div className="main">
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
              </div>
            </StyledContainer>
          </SearchModal>
        </GlobalSearchHotKeys>
      </SearchContext.Provider>
    </ThemeProvider>
  );
}

export default GlobalSearch;
