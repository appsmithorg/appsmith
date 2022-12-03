import { sortBy } from "lodash";
import {
  ReduxAction,
  ReduxActionTypes,
  Page,
  ClonePageSuccessPayload,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import {
  GenerateCRUDSuccess,
  UpdatePageErrorPayload,
} from "actions/pageActions";
import { UpdatePageRequest, UpdatePageResponse } from "api/PageApi";
import { DSL } from "reducers/uiReducers/pageCanvasStructureReducer";

const initialState: PageListReduxState = {
  pages: [],
  isGeneratingTemplatePage: false,
  applicationId: "",
  currentPageId: "",
  defaultPageId: "",
  loading: {},
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
    action: ReduxAction<{ pages: Page[]; applicationId: string }>,
  ) => {
    return {
      ...state,
      ...action.payload,
      defaultPageId:
        action.payload.pages.find((page) => page.isDefault)?.pageId ||
        action.payload.pages[0].pageId,
    };
  },
  [ReduxActionTypes.UPDATE_PAGE_LIST]: (
    state: PageListReduxState,
    action: ReduxAction<
      Array<{ pageId: string; dsl: DSL; userPermissions: string[] }>
    >,
  ) => {
    const pagePermissionsMap = action.payload.reduce((acc, page) => {
      acc[page.pageId] = page.userPermissions;
      return acc;
    }, {} as Record<string, string[]>);

    return {
      ...state,
      pages: state.pages.map((page) => {
        return {
          ...page,
          userPermissions: pagePermissionsMap[page.pageId] ?? [],
        };
      }),
    };
  },
  [ReduxActionTypes.RESET_PAGE_LIST]: () => initialState,
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{
      pageName: string;
      pageId: string;
      layoutId: string;
      isDefault: boolean;
      slug: string;
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
    action: ReduxAction<{ id: string; slug?: string; permissions?: string[] }>,
  ) => {
    const pageList = state.pages.map((page) => {
      if (page.pageId === action.payload.id)
        page.userPermissions = action.payload.permissions;
      return page;
    });
    return {
      ...state,
      currentPageId: action.payload.id,
      pages: pageList,
    };
  },
  [ReduxActionTypes.UPDATE_PAGE_INIT]: (
    state: PageListReduxState,
    action: ReduxAction<UpdatePageRequest>,
  ) => {
    return {
      ...state,
      loading: {
        ...state.loading,
        [action.payload.id]: true,
      },
    };
  },
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<UpdatePageResponse>,
  ) => {
    const pages = [...state.pages];
    const updatedPageIndex = pages.findIndex(
      (page) => page.pageId === action.payload.id,
    );

    if (updatedPageIndex !== -1) {
      const updatedPage = {
        ...pages[updatedPageIndex],
        pageName: action.payload.name,
        isHidden: !!action.payload.isHidden,
        slug: action.payload.slug,
        customSlug: action.payload.customSlug,
      };
      pages.splice(updatedPageIndex, 1, updatedPage);
    }

    return {
      ...state,
      pages,
      loading: {
        ...state.loading,
        [action.payload.id]: false,
      },
    };
  },
  [ReduxActionErrorTypes.UPDATE_PAGE_ERROR]: (
    state: PageListReduxState,
    action: ReduxAction<UpdatePageErrorPayload>,
  ) => {
    return {
      ...state,
      loading: {
        ...state.loading,
        [action.payload.request.id]: false,
      },
    };
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
        slug: action.payload.page.slug,
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
  pages: Page[];
  applicationId: string;
  defaultPageId: string;
  currentPageId: string;
  appLayout?: AppLayoutConfig;
  isGeneratingTemplatePage?: boolean;
  loading: Record<string, boolean>;
}

export default pageListReducer;
