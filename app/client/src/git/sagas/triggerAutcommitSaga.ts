import { triggerAutocommitSuccessAction } from "actions/gitSyncActions";
import { AutocommitStatus, type GitArtifactType } from "git/constants/enums";
import fetchAutocommitProgressRequest from "git/requests/fetchAutocommitProgressRequest";
import type {
  FetchAutocommitProgressResponse,
  FetchAutocommitProgressResponseData,
} from "git/requests/fetchAutocommitProgressRequest.types";
import triggerAutocommitRequest from "git/requests/triggerAutocommitRequest";
import type {
  TriggerAutocommitResponse,
  TriggerAutocommitResponseData,
} from "git/requests/triggerAutocommitRequest.types";
import type { TriggerAutocommitInitPayload } from "git/store/actions/triggerAutocommitActions";
import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { selectAutocommitEnabled } from "git/store/selectors/gitSingleArtifactSelectors";
import type { GitArtifactPayloadAction } from "git/store/types";
import {
  call,
  cancel,
  delay,
  fork,
  put,
  select,
  take,
} from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

interface PollAutcommitProgressParams {
  artifactType: keyof typeof GitArtifactType;
  baseArtifactId: string;
  artifactId: string;
}

function isAutocommitHappening(
  responseData:
    | TriggerAutocommitResponseData
    | FetchAutocommitProgressResponseData
    | undefined,
): boolean {
  return (
    !!responseData &&
    (responseData.autoCommitResponse === AutocommitStatus.PUBLISHED ||
      responseData.autoCommitResponse === AutocommitStatus.IN_PROGRESS ||
      responseData.autoCommitResponse === AutocommitStatus.LOCKED)
  );
}

function* pollAutocommitProgressSaga(params: PollAutcommitProgressParams) {
  const { artifactId, artifactType, baseArtifactId } = params;
  const basePayload = { artifactType, baseArtifactId };
  let triggerResponse: TriggerAutocommitResponse | undefined;

  try {
    triggerResponse = yield call(triggerAutocommitRequest, artifactId);
    const isValidResponse: boolean = yield validateResponse(triggerResponse);

    if (triggerResponse && isValidResponse) {
      yield put(gitArtifactActions.triggerAutocommitSuccess(basePayload));
    }
  } catch (error) {
    yield put(
      gitArtifactActions.triggerAutocommitError({
        ...basePayload,
        error: error as string,
      }),
    );
  }

  try {
    if (isAutocommitHappening(triggerResponse?.data)) {
      yield put(gitArtifactActions.pollAutocommitProgressStart(basePayload));

      while (true) {
        yield put(gitArtifactActions.fetchAutocommitProgressInit(basePayload));
        const progressResponse: FetchAutocommitProgressResponse = yield call(
          fetchAutocommitProgressRequest,
          baseArtifactId,
        );
        const isValidResponse: boolean =
          yield validateResponse(progressResponse);

        if (isValidResponse && !isAutocommitHappening(progressResponse?.data)) {
          yield put(gitArtifactActions.pollAutcommitProgressStop(basePayload));
        }

        if (!isValidResponse) {
          yield put(gitArtifactActions.pollAutcommitProgressStop(basePayload));
        }

        yield delay(1000);
      }
    } else {
      yield put(gitArtifactActions.pollAutcommitProgressStop(basePayload));
    }
  } catch (error) {
    yield put(gitArtifactActions.pollAutcommitProgressStop(basePayload));
    yield put(
      gitArtifactActions.fetchAutocommitProgressError({
        ...basePayload,
        error: error as string,
      }),
    );
  }
}

export default function* triggerAutocommitSaga(
  action: GitArtifactPayloadAction<TriggerAutocommitInitPayload>,
) {
  const { artifactId, artifactType, baseArtifactId } = action.payload;
  const basePayload = { artifactType, baseArtifactId };
  const isAutocommitEnabled: boolean = yield select(
    selectAutocommitEnabled,
    basePayload,
  );

  if (isAutocommitEnabled) {
    const params = { artifactType, baseArtifactId, artifactId };
    /* @ts-expect-error: not sure how to do typings of this */
    const pollTask = yield fork(pollAutocommitProgressSaga, params);

    yield take(gitArtifactActions.pollAutcommitProgressStop.type);
    yield cancel(pollTask);
  } else {
    yield put(triggerAutocommitSuccessAction());
  }
}
