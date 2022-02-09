import { createSelector } from "reselect";
import { AppState } from "reducers";
import { AppViewReduxState } from "reducers/uiReducers/appViewReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

const getAppViewState = (state: AppState) => state.ui.appView;
const getPageListState = (state: AppState): PageListReduxState =>
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
  (pageList: PageListReduxState) =>
    pageList.pages.length > 0 ? pageList.pages : undefined,
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
  (pageList: PageListReduxState) => pageList.currentPageId,
);
