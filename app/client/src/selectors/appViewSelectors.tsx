import { createSelector } from "reselect";
import { AppState } from "reducers";
import { AppViewReduxState } from "reducers/uiReducers/appViewReducer";
import { PageListViewModeReduxState } from "reducers/entityReducers/pageListReducer";
import { BUILDER_PAGE_URL } from "constants/routes";

const getAppViewState = (state: AppState) => state.ui.appView;
const getPageListState = (state: AppState): PageListViewModeReduxState =>
  state.entities.pageList;

// For the viewer, this does not need to be wrapped in createCachedSelector, as it will not change in subsequent renders.
// export const getCurrentPageLayoutDSL = createSelector(
//   getAppViewState,
//   getDataTree,
//   (view: AppViewReduxState, dataTree: DataTree) =>
//     injectDataTreeIntoDsl(dataTree, view.dsl),
// );

export const getPageList = createSelector(
  getPageListState,
  (pageListViewMode: PageListViewModeReduxState) =>
  pageListViewMode.pages.length > 0 ? pageListViewMode.pages : undefined,
);

export const getIsFetchingPage = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => view.isFetchingPage,
);

export const getIsInitialized = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => view.initialized,
);

export const getCurrentDSLPageId = createSelector(
  getPageListState,
  (pageListViewMode: PageListViewModeReduxState) => pageListViewMode.currentPageId,
);

export const getEditorURL = createSelector(
  getPageListState,
  (pageListViewMode: PageListViewModeReduxState) =>
  pageListViewMode.applicationId && pageListViewMode.currentPageId
      ? BUILDER_PAGE_URL(pageListViewMode.applicationId, pageListViewMode.currentPageId)
      : "",
);
