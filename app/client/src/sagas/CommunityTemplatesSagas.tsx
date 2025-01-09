import type { ReduxAction } from "../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { validateResponse, type ErrorActionPayload } from "./ErrorSagas";
import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import { toast } from "@appsmith/ads";
import type {
  PublishCommunityTemplateRequest,
  PublishCommunityTemplateResponse,
} from "api/TemplatesApi";
import TemplatesAPI from "api/TemplatesApi";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import type { UpdateUserRequest } from "ee/api/UserApi";
import UserApi from "ee/api/UserApi";
import type { PublishCommunityTemplatePayload } from "actions/communityTemplateActions";
import type { ApiResponse } from "api/ApiResponses";

const isAirgappedInstance = isAirgapped();

function* updateUserDetails(payload: PublishCommunityTemplatePayload) {
  if (!payload.shouldUpdateEmail && !payload.shouldUpdateName) return;

  const request: UpdateUserRequest = {};

  payload.shouldUpdateEmail && (request.email = payload.authorEmail);
  payload.shouldUpdateName && (request.name = payload.authorName);

  const response: ApiResponse = yield call(UserApi.updateUser, request);
  const isValidResponse: boolean = yield validateResponse(response);

  if (isValidResponse) {
    yield put({
      type: ReduxActionTypes.UPDATE_USER_DETAILS_SUCCESS,
      payload: response.data,
    });
  }
}

function* handleFailure(error: unknown) {
  const payload: ErrorActionPayload = {
    show: true,
    error: {
      message:
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).message ??
        createMessage(COMMUNITY_TEMPLATES.publishFormPage.publishedFailedError),
    },
  };

  yield put({
    type: ReduxActionErrorTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_ERROR,
    payload,
  });
}

function* publishCommunityTemplateSaga(
  action: ReduxAction<PublishCommunityTemplatePayload>,
) {
  try {
    yield call(updateUserDetails, action.payload);
  } catch (error) {}

  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const requestObj: PublishCommunityTemplateRequest = {
      applicationId,
      workspaceId,
      ...action.payload,
    };

    if ("authorName" in requestObj) delete requestObj.authorName;

    if ("shouldUpdateEmail" in requestObj) delete requestObj.shouldUpdateEmail;

    if ("shouldUpdateName" in requestObj) delete requestObj.shouldUpdateName;

    const response: PublishCommunityTemplateResponse = yield call(
      TemplatesAPI.publishCommunityTemplate,
      requestObj,
    );
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      toast.show(`Template published to community`, {
        kind: "success",
      });
      yield put({
        type: ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_SUCCESS,
        payload: response,
      });
      yield put({
        type: ReduxActionTypes.CURRENT_APPLICATION_COMMUNITY_TEMPLATE_STATUS_UPDATE,
        payload: {
          isCommunityTemplate: response.data.isCommunityTemplate,
          isPublic: response.data.isPublic,
          forkingEnabled: response.data.forkingEnabled,
        },
      });
    } else {
      yield handleFailure(response);
    }
  } catch (error) {
    yield handleFailure(error);
  }
}

export default function* watchActionSagas() {
  if (!isAirgappedInstance)
    yield all([
      takeEvery(
        ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_INIT,
        publishCommunityTemplateSaga,
      ),
    ]);
}
