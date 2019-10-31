import { createSelector } from "reselect";
import { AppState } from "../reducers";
import { AppViewReduxState } from "../reducers/uiReducers/appViewReducer";
import { AppViewerProps } from "../pages/AppViewer";

const getAppViewState = (state: AppState) => state.ui.view;

export const getCurrentLayoutId = (state: AppState, props: AppViewerProps) =>
  state.ui.view.currentLayoutId || props.match.params.layoutId;
export const getCurrentPageId = (state: AppState, props: AppViewerProps) =>
  state.ui.view.currentPageId || props.match.params.pageId;

// For the viewer, this does not need to be wrapped in createCachedSelector, as it will not change in subsequent renders.
export const getCurrentPageLayoutDSL = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => view.dsl,
);

export const getPageList = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => (view.pages.length > 0 ? view.pages : undefined),
);
