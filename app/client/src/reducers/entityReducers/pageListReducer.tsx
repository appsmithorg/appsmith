import { sortBy } from "lodash";
import {
  ReduxAction,
  ReduxActionTypes,
  PageListPayload,
  ClonePageSuccessPayload,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { GenerateCRUDSuccess } from "actions/pageActions";

const initialState: PageListReduxState = {
  pages: [],
  isGeneratingTemplatePage: false,
};

export const pageListReducer = createReducer(initialState, {
  [ReduxActionTypes.DELETE_PAGE_INIT]: (
    state: PageListReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    if (state.defaultPageId !== action.payload.id) {
      const pages = [
        ...state.pages.filter((page) => page.pageId !== action.payload.id),
      ];
      return {
        ...state,
        pages,
      };
    }
    return state;
  },
  [ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ pages: PageListPayload; applicationId: string }>,
  ) => {
    return {
      ...state,
      ...action.payload,
      defaultPageId:
        action.payload.pages.find((page) => page.isDefault)?.pageId ||
        action.payload.pages[0].pageId,
    };
  },
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{
      pageName: string;
      pageId: string;
      layoutId: string;
      isDefault: boolean;
    }>,
  ) => {
    const _state = state;
    _state.pages = state.pages.map((page) => ({ ...page, latest: false }));
    _state.pages.push({ ...action.payload, latest: true });
    return { ..._state };
  },
  [ReduxActionTypes.CLONE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<ClonePageSuccessPayload>,
  ): PageListReduxState => {
    return {
      ...state,
      pages: state.pages
        .map((page) => ({ ...page, latest: false }))
        .concat([{ ...action.payload, latest: true }]),
    };
  },
  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ pageId: string; applicationId: string }>,
  ) => {
    if (
      state.applicationId === action.payload.applicationId &&
      state.defaultPageId !== action.payload.pageId
    ) {
      const pageList = state.pages.map((page) => {
        if (page.pageId === state.defaultPageId) page.isDefault = false;
        if (page.pageId === action.payload.pageId) page.isDefault = true;
        return page;
      });
      return {
        ...state,
        pages: pageList,
        defaultPageId: action.payload.pageId,
      };
    }
    return state;
  },
  [ReduxActionTypes.SWITCH_CURRENT_PAGE_ID]: (
    state: PageListReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    currentPageId: action.payload.id,
  }),
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{ id: string; name: string; isHidden?: boolean }>,
  ) => {
    const pages = [...state.pages];
    const updatedPage = pages.find((page) => page.pageId === action.payload.id);
    if (updatedPage) {
      updatedPage.pageName = action.payload.name;
      updatedPage.isHidden = !!action.payload.isHidden;
    }

    return { ...state, pages };
  },
  [ReduxActionTypes.GENERATE_TEMPLATE_PAGE_INIT]: (
    state: PageListReduxState,
  ) => {
    return { ...state, isGeneratingTemplatePage: true };
  },
  [ReduxActionTypes.GENERATE_TEMPLATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<GenerateCRUDSuccess>,
  ) => {
    const _state = state;
    if (action.payload.isNewPage) {
      _state.pages = state.pages.map((page) => ({ ...page, latest: false }));
      const newPage = {
        pageName: action.payload.page.name,
        pageId: action.payload.page.id,
        layoutId: action.payload.page.layouts[0].id,
        isDefault: !!action.payload.page.isDefault,
      };
      _state.pages.push({ ...newPage, latest: true });
    }

    return {
      ..._state,
      isGeneratingTemplatePage: false,
    };
  },
  [ReduxActionErrorTypes.GENERATE_TEMPLATE_PAGE_ERROR]: (
    state: PageListReduxState,
  ) => {
    return { ...state, isGeneratingTemplatePage: false };
  },
  [ReduxActionTypes.SET_PAGE_ORDER_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{
      pages: {
        id: string;
      }[];
    }>,
  ) => {
    const sortingOrder = action.payload.pages.map((page) => page.id);
    const sortedPages = sortBy(state.pages, (page) => {
      return sortingOrder.indexOf(page.pageId);
    });

    return { ...state, pages: sortedPages };
  },
});

export type SupportedLayouts =
  | "DESKTOP"
  | "TABLET_LARGE"
  | "TABLET"
  | "MOBILE"
  | "FLUID";
export interface AppLayoutConfig {
  type: SupportedLayouts;
}

export interface PageListReduxState {
  pages: PageListPayload;
  applicationId?: string;
  defaultPageId?: string;
  currentPageId?: string;
  appLayout?: AppLayoutConfig;
  isGeneratingTemplatePage?: boolean;
}

export default pageListReducer;
