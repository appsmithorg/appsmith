import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  ClonePageSuccessPayload,
  DeletePageActionPayload,
  GenerateCRUDSuccess,
  UpdateCurrentPagePayload,
  UpdatePageActionPayload,
  UpdatePageErrorPayload,
} from "actions/pageActions";
import type { UpdatePageResponse } from "api/PageApi";
import { sortBy } from "lodash";
import type { DSL } from "reducers/uiReducers/pageCanvasStructureReducer";
import { createReducer } from "utils/ReducerUtils";
import type { Page } from "entities/Page";
import type { SupportedLayouts } from "./types";

// exporting it as well so that existing imports are not affected
// TODO: remove this once all imports are updated
export type { SupportedLayouts };

const initialState: PageListReduxState = {
  pages: [],
  isGeneratingTemplatePage: false,
  generatePage: {
    modalOpen: false,
    params: {},
  },
  baseApplicationId: "",
  applicationId: "",
  currentBasePageId: "",
  currentPageId: "",
  defaultBasePageId: "",
  defaultPageId: "",
  loading: {},
};

export const pageListReducer = createReducer(initialState, {
  [ReduxActionTypes.DELETE_PAGE_INIT]: (
    state: PageListReduxState,
    action: ReduxAction<DeletePageActionPayload>,
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
    action: ReduxAction<{
      pages: Page[];
      applicationId: string;
      baseApplicationId: string;
    }>,
  ) => {
    const defaultPage =
      action.payload.pages.find((page) => page.isDefault) ??
      action.payload.pages[0];

    return {
      ...state,
      ...action.payload,
      defaultPageId: defaultPage?.pageId,
      defaultBasePageId: defaultPage?.basePageId,
    };
  },
  [ReduxActionTypes.UPDATE_PAGE_LIST]: (
    state: PageListReduxState,
    action: ReduxAction<
      Array<{ pageId: string; dsl: DSL; userPermissions: string[] }>
    >,
  ) => {
    const pagePermissionsMap = action.payload.reduce(
      (acc, page) => {
        acc[page.pageId] = page.userPermissions;

        return acc;
      },
      {} as Record<string, string[]>,
    );

    return {
      ...state,
      pages: state.pages.map((page) => {
        return {
          ...page,
          userPermissions:
            pagePermissionsMap[page.pageId] ?? (page.userPermissions || []),
        };
      }),
    };
  },
  [ReduxActionTypes.RESET_PAGE_LIST]: () => initialState,
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: PageListReduxState,
    action: ReduxAction<{
      pageName: string;
      description?: string;
      pageId: string;
      basePageId: string;
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
      const defaultPage: Page | null =
        state.pages.find((page) => page.pageId === action.payload.pageId) ||
        null;
      const pageList = state.pages.map((page) => {
        if (page.pageId === state.defaultPageId) page.isDefault = false;

        if (page.pageId === action.payload.pageId) page.isDefault = true;

        return page;
      });

      return {
        ...state,
        pages: pageList,
        defaultPageId: defaultPage?.pageId ?? "",
        defaultBasePageId: defaultPage?.basePageId ?? "",
      };
    }

    return state;
  },
  [ReduxActionTypes.SWITCH_CURRENT_PAGE_ID]: (
    state: PageListReduxState,
    action: ReduxAction<UpdateCurrentPagePayload>,
  ) => {
    const pageList: Page[] = [];
    const currentPageId: string = action.payload.id;
    let currentBasePageId: string = "";

    state.pages.forEach((page) => {
      const modifiedPage = { ...page };

      if (page.pageId === action.payload.id) {
        currentBasePageId = page.basePageId;

        if (action.payload.permissions) {
          modifiedPage.userPermissions = action.payload.permissions;
        }
      }

      pageList.push(modifiedPage);
    });

    return {
      ...state,
      currentPageId,
      currentBasePageId,
      pages: pageList,
    };
  },
  [ReduxActionTypes.UPDATE_PAGE_INIT]: (
    state: PageListReduxState,
    action: ReduxAction<UpdatePageActionPayload>,
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
        [action.payload.request.pageId]: false,
      },
    };
  },
  [ReduxActionTypes.SET_GENERATE_PAGE_MODAL_OPEN]: (
    state: PageListReduxState,
    action: ReduxAction<GeneratePageModalParams>,
  ) => {
    return {
      ...state,
      generatePage: {
        modalOpen: true,
        params: action.payload || {},
      },
    };
  },
  [ReduxActionTypes.SET_GENERATE_PAGE_MODAL_CLOSE]: (
    state: PageListReduxState,
  ) => ({
    ...state,
    generatePage: {
      ...state.generatePage,
      modalOpen: false,
    },
  }),
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
        basePageId: action.payload.page.baseId,
        layoutId: action.payload.page.layouts[0].id,
        isDefault: !!action.payload.page.isDefault,
        slug: action.payload.page.slug,
        description: action.payload.page.description,
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

export interface AppLayoutConfig {
  type: SupportedLayouts;
}

export interface GeneratePageModalParams {
  datasourceId?: string;
  new_page?: boolean;
}

export interface PageListReduxState {
  pages: Page[];
  baseApplicationId: string;
  applicationId: string;
  currentBasePageId: string;
  currentPageId: string;
  defaultBasePageId: string;
  defaultPageId: string;
  appLayout?: AppLayoutConfig;
  isGeneratingTemplatePage?: boolean;
  generatePage?: {
    modalOpen: boolean;
    params?: GeneratePageModalParams;
  };
  loading: Record<string, boolean>;
}

export default pageListReducer;
