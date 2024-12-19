import { triggerAutocommitSuccessAction } from "actions/gitSyncActions";
import {
  AutocommitStatusState,
  type GitArtifactType,
} from "git/constants/enums";
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
import type { Task } from "redux-saga";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { captureException } from "@sentry/react";

const AUTOCOMMIT_POLL_DELAY = 1000;
const AUTOCOMMIT_WHITELISTED_STATES = [
  AutocommitStatusState.PUBLISHED,
  AutocommitStatusState.IN_PROGRESS,
  AutocommitStatusState.LOCKED,
];

interface PollAutocommitProgressParams {
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
    AUTOCOMMIT_WHITELISTED_STATES.includes(responseData.autoCommitResponse)
  );
}

function* pollAutocommitProgressSaga(params: PollAutocommitProgressParams) {
  const { artifactId, artifactType, baseArtifactId } = params;
  const basePayload = { artifactType, baseArtifactId };
  let triggerResponse: TriggerAutocommitResponse | undefined;

  try {
    triggerResponse = yield call(triggerAutocommitRequest, artifactId);
    const isValidResponse: boolean = yield validateResponse(triggerResponse);

    if (triggerResponse && isValidResponse) {
      yield put(gitArtifactActions.triggerAutocommitSuccess(basePayload));
    }
  } catch (e) {
    if (triggerResponse && triggerResponse.responseMeta.error) {
      const { error } = triggerResponse.responseMeta;

      yield put(
        gitArtifactActions.triggerAutocommitError({ ...basePayload, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }

  let progressResponse: FetchAutocommitProgressResponse | null = null;

  try {
    if (isAutocommitHappening(triggerResponse?.data)) {
      yield put(gitArtifactActions.pollAutocommitProgressStart(basePayload));

      while (true) {
        yield put(gitArtifactActions.fetchAutocommitProgressInit(basePayload));
        progressResponse = yield call(
          fetchAutocommitProgressRequest,
          baseArtifactId,
        );
        const isValidResponse: boolean =
          yield validateResponse(progressResponse);

        if (isValidResponse && !isAutocommitHappening(progressResponse?.data)) {
          yield put(gitArtifactActions.pollAutocommitProgressStop(basePayload));
        }

        if (!isValidResponse) {
          yield put(gitArtifactActions.pollAutocommitProgressStop(basePayload));
        }

        yield delay(AUTOCOMMIT_POLL_DELAY);
      }
    } else {
      yield put(gitArtifactActions.pollAutocommitProgressStop(basePayload));
    }
  } catch (e) {
    yield put(gitArtifactActions.pollAutocommitProgressStop(basePayload));

    if (progressResponse && progressResponse.responseMeta.error) {
      const { error } = progressResponse.responseMeta;

      yield put(
        gitArtifactActions.fetchAutocommitProgressError({
          ...basePayload,
          error,
        }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
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
    const pollTask: Task = yield fork(pollAutocommitProgressSaga, params);

    yield take(gitArtifactActions.pollAutocommitProgressStop.type);
    yield cancel(pollTask);
  } else {
    yield put(triggerAutocommitSuccessAction());
  }
}
