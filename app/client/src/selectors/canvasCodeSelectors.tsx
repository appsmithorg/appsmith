import type { AppState } from "@appsmith/reducers";
import { getActionById, getJSCollectionById } from "./editorSelectors";

export const isCanvasCodeActive = (state: AppState) =>
  state.ui.users.featureFlag.data.CANVAS_CODE === true;

export const getCodeTabPath = (state: AppState) =>
  state.ui.editorContext.codeTabPath;

export const getSelectedTab = (state: AppState) => state.ui.canvasCode.tab;

export const getIfCodeEntityExists = (state: AppState, id: string): boolean => {
  if (
    getActionById(state, {
      match: { params: { apiId: id } },
    }) ||
    getJSCollectionById(state, {
      match: { params: { collectionId: id } },
    })
  ) {
    return true;
  }
  return false;
};
