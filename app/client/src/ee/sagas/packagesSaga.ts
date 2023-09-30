import { takeLatest, all, call, put, select } from "redux-saga/effects";

import history from "utils/history";
import PackageApi from "@appsmith/api/PackageApi";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import {
  CREATE_PACKAGE_ERROR,
  createMessage,
  FETCH_PACKAGE_ERROR,
} from "@appsmith/constants/messages";
import {
  getIsFetchingPackages,
  getPackagesList,
  getIsCreatingPackage,
} from "@appsmith/selectors/packageSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  BASE_PACKAGE_URL,
  DEFAULT_PACKAGE_COLOR,
  DEFAULT_PACKAGE_ICON,
  DEFAULT_PACKAGE_PREFIX,
} from "@appsmith/constants/PackageConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { CreatePackageFromWorkspacePayload } from "@appsmith/actions/packageActions";
import type { CreatePackagePayload } from "@appsmith/api/PackageApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  Package,
  PackageMetadata,
} from "@appsmith/constants/PackageConstants";

type CreatePackageSagaProps = {
  workspaceId: string;
  name?: string;
  icon?: string;
  color?: string;
};

export function* fetchAllPackagesSaga() {
  try {
    const response: ApiResponse = yield call(PackageApi.fetchAllPackages);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGE_ERROR) } },
    });
  }
}

/**
 * Saga creates a package and specifically should be called from workspace
 */
export function* createPackageFromWorkspaceSaga(
  action: ReduxAction<CreatePackageFromWorkspacePayload>,
) {
  try {
    const { workspaceId } = action.payload;

    const isFetchingPackagesList: boolean = yield select(getIsFetchingPackages);
    const isCreatingPackage: boolean = yield select(
      getIsCreatingPackage,
      workspaceId,
    );

    if (isFetchingPackagesList || isCreatingPackage) return;

    const response: ApiResponse<Package> = yield call(createPackageSaga, {
      workspaceId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const { id } = response.data;

      yield put({
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: response.data,
      });

      history.push(`${BASE_PACKAGE_URL}/${id}`);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
      payload: {
        error: {
          message: createMessage(CREATE_PACKAGE_ERROR),
        },
      },
    });
  }
}

/**
 * Creates a package based on the workspaceId provided. name, icon and color are optional, so if
 * they are not provided; the saga will auto generate them.
 * For name, the saga will will look into existing packages in the workspace and generate the next
 * possible name.
 *
 * @param payload - CreatePackageSagaProps
 *  {
      workspaceId: string;
      name?: string;
      icon?: string;
      color?: string;
    }
 * @returns
 */
export function* createPackageSaga(payload: CreatePackageSagaProps) {
  try {
    const packageList: PackageMetadata[] = yield select(getPackagesList);

    const name = (() => {
      if (payload.name) return payload.name;

      const currentWorkspacePackages = packageList
        .filter(({ workspaceId }) => workspaceId === payload.workspaceId)
        .map(({ name }) => name);

      return getNextEntityName(
        DEFAULT_PACKAGE_PREFIX,
        currentWorkspacePackages,
      );
    })();

    const body: CreatePackagePayload = {
      workspaceId: payload.workspaceId,
      name,
      icon: payload.icon || DEFAULT_PACKAGE_ICON,
      color: payload.color || DEFAULT_PACKAGE_COLOR,
    };

    const response: ApiResponse = yield call(PackageApi.createPackage, body);
    return response;
  } catch (error) {
    throw error;
  }
}

export default function* packagesSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_ALL_PACKAGES_INIT, fetchAllPackagesSaga),
    takeLatest(
      ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
      createPackageFromWorkspaceSaga,
    ),
  ]);
}
