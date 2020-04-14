import { call, takeLatest, put, all, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxActionWithPromise,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import ProvidersApi, {
  FetchProviderTemplateResponse,
  FetchProviderTemplatesRequest,
  AddApiToPageRequest,
  FetchProviderCategoriesResponse,
} from "api/ProvidersApi";
import { Providers } from "constants/providerConstants";
import { FetchProviderWithCategoryRequest } from "api/ProvidersApi";
import { fetchActions } from "actions/actionActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { ToastType } from "react-toastify";
import { ADD_API_TO_PAGE_SUCCESS_MESSAGE } from "constants/messages";

export function* fetchProviderTemplatesSaga(
  action: ReduxActionWithPromise<FetchProviderTemplatesRequest>,
) {
  const { providerId } = action.payload;
  try {
    const request: FetchProviderTemplatesRequest = { providerId };

    const response: FetchProviderTemplateResponse = yield ProvidersApi.fetchProviderTemplates(
      request,
    );

    const isValidResponse = yield validateResponse(response);

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
  const request: AddApiToPageRequest = action.payload;
  try {
    const response: FetchProviderTemplateResponse = yield ProvidersApi.addApiToPage(
      request,
    );

    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      AppToaster.show({
        message: ADD_API_TO_PAGE_SUCCESS_MESSAGE,
        type: ToastType.SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.ADD_API_TO_PAGE_SUCCESS,
        data: response.data,
      });
      const applicationId = yield select(getCurrentApplicationId);
      yield put(fetchActions(applicationId));
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

    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
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
    takeLatest(
      ReduxActionTypes.FETCH_PROVIDERS_WITH_CATEGORY_INIT,
      fetchProvidersWithCategorySaga,
    ),
  ]);
}
