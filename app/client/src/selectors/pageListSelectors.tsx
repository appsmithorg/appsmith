import { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";

import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

const getPageListState = (state: AppState) => state.entities.pageList;

export const getPageLoadingState = (pageId: string) =>
  createSelector(
    getPageListState,
    (pageList: PageListReduxState) => pageList.loading[pageId],
  );

export const getIsGeneratingTemplatePage = createSelector(
  getPageListState,
  (pageList: PageListReduxState) => pageList.isGeneratingTemplatePage,
);
