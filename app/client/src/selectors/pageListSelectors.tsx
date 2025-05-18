import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";

import type { PageListReduxState } from "reducers/entityReducers/pageListReducer";

const getPageListState = (state: DefaultRootState) => state.entities.pageList;

export const getPageLoadingState = (pageId: string) =>
  createSelector(
    getPageListState,
    (pageList: PageListReduxState) => pageList.loading[pageId],
  );

export const getIsGeneratingTemplatePage = createSelector(
  getPageListState,
  (pageList: PageListReduxState) => pageList.isGeneratingTemplatePage,
);

export const getIsGeneratePageModalOpen = (state: DefaultRootState) =>
  state.entities.pageList.generatePage?.modalOpen;

export const getGeneratePageModalParams = (state: DefaultRootState) =>
  state.entities.pageList.generatePage?.params;

export const convertToPageIdSelector = (
  state: DefaultRootState,
  basePageId: string,
) =>
  state.entities.pageList.pages?.find((page) => page.basePageId === basePageId)
    ?.pageId;

export const convertToBasePageIdSelector = (
  state: DefaultRootState,
  pageId: string,
) =>
  state.entities.pageList.pages?.find((page) => page.pageId === pageId)
    ?.basePageId;

export const convertToBaseParentEntityIdSelector = (
  state: DefaultRootState,
  parentEntityId: string,
) => {
  let baseParentEntityId = convertToBasePageIdSelector(state, parentEntityId);

  if (!baseParentEntityId) {
    baseParentEntityId = parentEntityId;
  }

  return baseParentEntityId;
};

export const getPageIdToBasePageIdMap = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.reduce((acc: Record<string, string>, page) => {
      acc[page.pageId] = page.basePageId;

      return acc;
    }, {}),
);

export const getBasePageIdToPageIdMap = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.reduce((acc: Record<string, string>, page) => {
      acc[page.basePageId] = page.pageId;

      return acc;
    }, {}),
);
