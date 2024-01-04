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
  FETCH_PACKAGES_ERROR,
} from "@appsmith/constants/messages";
import {
  getIsFetchingPackages,
  getPackagesList,
} from "@appsmith/selectors/packageSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  DEFAULT_PACKAGE_COLOR,
  DEFAULT_PACKAGE_ICON,
  DEFAULT_PACKAGE_PREFIX,
} from "@appsmith/constants/PackageConstants";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import type { ApiResponse } from "api/ApiResponses";
import type {
  CreatePackageFromWorkspacePayload,
  DeletePackagePayload,
  FetchConsumablePackagesInWorkspacePayload,
  FetchPackagePayload,
  PublishPackagePayload,
} from "@appsmith/actions/packageActions";
import type {
  CreatePackagePayload,
  FetchPackageResponse,
} from "@appsmith/api/PackageApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  Package,
  PackageMetadata,
} from "@appsmith/constants/PackageConstants";
import { toast } from "design-system";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";

interface CreatePackageSagaProps {
  workspaceId: string;
  name?: string;
  icon?: string;
  color?: string;
}

export function* fetchAllPackagesSaga() {
  try {
    const showQueryModule: boolean = yield select(getShowQueryModule);
    if (showQueryModule) {
      const response: ApiResponse = yield call(PackageApi.fetchAllPackages);
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
          payload: response.data,
        });
      }
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
        payload: [],
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGES_ERROR) } },
    });
  }
}

export function* fetchConsumablePackagesInWorkspaceSaga(
  action: ReduxAction<FetchConsumablePackagesInWorkspacePayload>,
) {
  try {
    const response: ApiResponse = yield call(
      PackageApi.fetchConsumablePackagesInWorkspace,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_ERROR,
      payload: { error: { message: createMessage(FETCH_PACKAGES_ERROR) } },
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

    if (isFetchingPackagesList) return;

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

      history.push(`${BASE_PACKAGE_EDITOR_PATH}/${id}`);
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

export function* fetchPackageSaga(payload: FetchPackagePayload) {
  try {
    const response: ApiResponse<FetchPackageResponse> = yield call(
      PackageApi.fetchPackage,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
        payload: response.data,
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PACKAGE_ERROR,
      payload: {
        error: {
          message: createMessage(FETCH_PACKAGE_ERROR),
        },
      },
    });
  }
}

export function* updatePackageSaga(action: ReduxAction<Package>) {
  try {
    const packageData: Package = yield call(PackageApi.fetchPackage, {
      packageId: action.payload.id,
    });
    const response: ApiResponse<Package> = yield call(
      PackageApi.updatePackage,
      { ...packageData, ...action.payload },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
        payload: response.data,
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deletePackageSaga(action: ReduxAction<DeletePackagePayload>) {
  try {
    const response: ApiResponse<Package> = yield call(
      PackageApi.deletePackage,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_PACKAGE_SUCCESS,
        payload: action.payload,
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* publishPackageSaga(
  action: ReduxAction<PublishPackagePayload>,
) {
  try {
    const response: ApiResponse<PublishPackagePayload> = yield call(
      PackageApi.publishPackage,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.PUBLISH_PACKAGE_SUCCESS,
        payload: response.data,
      });

      toast.show("Package published successfully", { kind: "success" });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_PACKAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* packagesSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_ALL_PACKAGES_INIT, fetchAllPackagesSaga),
    takeLatest(
      ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_INIT,
      fetchConsumablePackagesInWorkspaceSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
      createPackageFromWorkspaceSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_PACKAGE_INIT, updatePackageSaga),
    takeLatest(ReduxActionTypes.DELETE_PACKAGE_INIT, deletePackageSaga),
    takeLatest(ReduxActionTypes.PUBLISH_PACKAGE_INIT, publishPackageSaga),
  ]);
}
