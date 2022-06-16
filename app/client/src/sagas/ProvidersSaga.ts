import {
  call,
  takeLatest,
  put,
  all,
  select,
  debounce,
} from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxActionWithPromise,
  ReduxAction,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import ProvidersApi, {
  FetchProviderTemplateResponse,
  FetchProviderTemplatesRequest,
  AddApiToPageRequest,
  FetchProviderCategoriesResponse,
  SearchApiOrProviderResponse,
  SearchApiOrProviderRequest,
  FetchProviderDetailsByProviderIdRequest,
  FetchProviderDetailsResponse,
} from "api/ProvidersApi";
import { Providers } from "constants/providerConstants";
import { FetchProviderWithCategoryRequest } from "api/ProvidersApi";
import { fetchActions } from "actions/pluginActionActions";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import {
  ADD_API_TO_PAGE_SUCCESS_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

export function* fetchProviderTemplatesSaga(
  action: ReduxActionWithPromise<FetchProviderTemplatesRequest>,
) {
  const { providerId } = action.payload;
  try {
    const request: FetchProviderTemplatesRequest = { providerId };

    const response: FetchProviderTemplateResponse = yield ProvidersApi.fetchProviderTemplates(
      request,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROVIDER_TEMPLATES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* addApiToPageSaga(
  action: ReduxActionWithPromise<AddApiToPageRequest>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const request: AddApiToPageRequest = {
    ...action.payload,
    workspaceId,
  };
  try {
    const response: FetchProviderTemplateResponse = yield ProvidersApi.addApiToPage(
      request,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const { payload } = action;
      const pageList: Page[] = yield select(getPageList);
      const page = pageList.find((page) => page.pageId === payload.pageId);
      AnalyticsUtil.logEvent("ADD_API_PAGE", {
        apiName: payload.name,
        providerName: payload.marketplaceElement.item.name,
        pageName: page?.pageName,
        source: payload.source,
      });
      Toaster.show({
        text: createMessage(ADD_API_TO_PAGE_SUCCESS_MESSAGE, payload.name),
        variant: Variant.success,
      });
      yield put({
        type: ReduxActionTypes.ADD_API_TO_PAGE_SUCCESS,
        data: response.data,
      });

      const applicationId: string = yield select(getCurrentApplicationId);
      yield put(fetchActions({ applicationId }, []));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_API_TO_PAGE_ERROR,
      payload: {
        error,
        templateId: request.marketplaceElement.id,
      },
    });
  }
}

export function* fetchProvidersWithCategorySaga(
  action: ReduxAction<FetchProviderWithCategoryRequest>,
) {
  try {
    const request: FetchProviderWithCategoryRequest = action.payload;
    const response: Providers = yield ProvidersApi.fetchProvidersWithCategory(
      request,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      if (response.data.providers.length === 0) {
        yield put({
          type: ReduxActionTypes.SET_PROVIDERS_LENGTH,
        });
      }

      yield put({
        type: ReduxActionTypes.FETCH_PROVIDERS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROVIDERS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchProvidersCategoriesSaga() {
  try {
    const response: FetchProviderCategoriesResponse = yield call(
      ProvidersApi.fetchProvidersCategories,
    );
    yield put({
      type: ReduxActionTypes.FETCH_PROVIDERS_CATEGORIES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROVIDERS_CATEGORIES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchProviderDetailsByProviderIdSaga(
  action: ReduxActionWithPromise<FetchProviderTemplatesRequest>,
) {
  const { providerId } = action.payload;
  try {
    const request: FetchProviderDetailsByProviderIdRequest = { providerId };

    const response: FetchProviderDetailsResponse = yield ProvidersApi.fetchProviderDetailsByProviderId(
      request,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* searchApiOrProviderSaga(
  action: ReduxAction<SearchApiOrProviderRequest>,
) {
  try {
    const response: SearchApiOrProviderResponse = yield call(
      ProvidersApi.seachApiOrProvider,
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SEARCH_APIORPROVIDERS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SEARCH_APIORPROVIDERS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* providersSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_INIT,
      fetchProviderTemplatesSaga,
    ),
    takeLatest(ReduxActionTypes.ADD_API_TO_PAGE_INIT, addApiToPageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_PROVIDERS_CATEGORIES_INIT,
      fetchProvidersCategoriesSaga,
    ),
    debounce(
      300,
      ReduxActionTypes.SEARCH_APIORPROVIDERS_INIT,
      searchApiOrProviderSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_PROVIDERS_WITH_CATEGORY_INIT,
      fetchProvidersWithCategorySaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_INIT,
      fetchProviderDetailsByProviderIdSaga,
    ),
  ]);
}
