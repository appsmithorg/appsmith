import { AppState } from "reducers";
import { createSelector } from "reselect";

import { PageListReduxState } from "reducers/entityReducers/pageListReducer";

const getPageListState = (state: AppState) => state.entities.pageList;

export const getIsGeneratingTemplatePage = createSelector(
  getPageListState,
  (pageList: PageListReduxState) => pageList.isGeneratingTemplatePage,
);
