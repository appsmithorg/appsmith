import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { all, put, takeEvery } from "redux-saga/effects";
import type { ErrorActionPayload } from "./ErrorSagas";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { toast } from "design-system";

const isAirgappedInstance = isAirgapped();

function* publishCommunityTemplateSaga(action: ReduxAction<string>) {
  try {
    // const response: FetchTemplateResponse = yield call(
    //   TemplatesAPI.getTemplateInformation,
    //   action.payload,
    // );
    // const isValid: boolean = yield validateResponse(response);
    const isValid = !!action;

    if (isValid) {
      toast.show(`Template published to community`, {
        kind: "success",
      });
      yield put({
        type: ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_SUCCESS,
        // payload: response.data,
      });
    } else {
      const payload: ErrorActionPayload = {
        show: true,
        error: {
          message: createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.publishedFailedError,
          ),
        },
      };
      yield put({
        type: ReduxActionErrorTypes.COMMUNITY_TEMPLATE_PUBLISH_ERROR,
        payload,
      });
    }
  } catch (error) {
    const payload: ErrorActionPayload = {
      show: true,
      error: {
        message:
          (error as any).message ??
          createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.publishedFailedError,
          ),
      },
    };
    yield put({
      type: ReduxActionErrorTypes.COMMUNITY_TEMPLATE_PUBLISH_ERROR,
      payload,
    });
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
