import { createSelector } from "reselect";
import { AppState, DataTree } from "../reducers";
import { AppViewReduxState } from "../reducers/uiReducers/appViewReducer";
import { AppViewerProps } from "../pages/AppViewer";
import { injectDataTreeIntoDsl } from "../utils/DynamicBindingUtils";
import { getDataTree } from "./entitiesSelector";

const getAppViewState = (state: AppState) => state.ui.appView;

export const getCurrentLayoutId = (state: AppState, props: AppViewerProps) =>
  state.ui.appView.currentLayoutId || props.match.params.layoutId;
export const getCurrentPageId = (state: AppState, props: AppViewerProps) =>
  state.ui.appView.currentPageId || props.match.params.pageId;
export const getCurrentRoutePageId = (state: AppState, props: AppViewerProps) =>
  props.match.params.pageId;

// For the viewer, this does not need to be wrapped in createCachedSelector, as it will not change in subsequent renders.
export const getCurrentPageLayoutDSL = createSelector(
  getAppViewState,
  getDataTree,
  (view: AppViewReduxState, dataTree: DataTree) =>
    injectDataTreeIntoDsl(dataTree, view.dsl),
);

export const getPageList = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => (view.pages.length > 0 ? view.pages : undefined),
);

export const getIsFetchingPage = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => view.isFetchingPage,
);

export const getCurrentDSLPageId = createSelector(
  getAppViewState,
  (view: AppViewReduxState) => view.currentPageId,
);
