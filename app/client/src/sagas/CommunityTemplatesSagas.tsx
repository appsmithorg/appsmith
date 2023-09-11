import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { validateResponse, type ErrorActionPayload } from "./ErrorSagas";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { toast } from "design-system";
import type {
  PublishCommunityTemplateRequest,
  PublishCommunityTemplateResponse,
} from "api/TemplatesApi";
import TemplatesAPI from "api/TemplatesApi";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const isAirgappedInstance = isAirgapped();

function* handleFailure(error: unknown) {
  const payload: ErrorActionPayload = {
    show: true,
    error: {
      message:
        (error as any).message ??
        createMessage(COMMUNITY_TEMPLATES.publishFormPage.publishedFailedError),
    },
  };
  yield put({
    type: ReduxActionErrorTypes.COMMUNITY_TEMPLATE_PUBLISH_ERROR,
    payload,
  });
}

function* publishCommunityTemplateSaga(
  action: ReduxAction<{
    title: string;
    headline: string;
    description: string;
    useCases: string[];
    authorEmail: string;
    authorName: string;
  }>,
) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const requestObj: PublishCommunityTemplateRequest = {
      applicationId,
      workspaceId,
      branchName: "",
      ...action.payload,
    };
    const response: PublishCommunityTemplateResponse = yield call(
      TemplatesAPI.publishCommunityTemplate,
      applicationId,
      workspaceId,
      requestObj,
    );
    const isValid: boolean = yield validateResponse(response);

    if (isValid) {
      toast.show(`Template published to community`, {
        kind: "success",
      });
      yield put({
        type: ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_SUCCESS,
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
        ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_INIT,
        publishCommunityTemplateSaga,
      ),
    ]);
}
