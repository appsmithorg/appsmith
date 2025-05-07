import { createSelector } from "reselect";
import type { DefaultRootState } from "react-redux";
import type { AppViewReduxState } from "reducers/uiReducers/appViewReducer";
import type { PageListReduxState } from "reducers/entityReducers/pageListReducer";

const getAppViewState = (state: DefaultRootState) => state.ui.appView;
const getPageListState = (state: DefaultRootState): PageListReduxState =>
  state.entities.pageList;

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

/**
 * returns the height of header in app view mode
 *
 * @param state
 * @returns
 */
export const getAppViewHeaderHeight = (state: DefaultRootState) => {
  return state.ui.appView.headerHeight;
};
