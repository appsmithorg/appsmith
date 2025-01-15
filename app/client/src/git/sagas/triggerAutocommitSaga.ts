import { triggerAutocommitSuccessAction } from "actions/gitSyncActions";
import { AutocommitStatusState } from "git/constants/enums";
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
import { selectAutocommitEnabled } from "git/store/selectors/gitArtifactSelectors";
import type { GitArtifactDef, GitArtifactPayloadAction } from "git/store/types";
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
import { selectGitApiContractsEnabled } from "git/store/selectors/gitFeatureFlagSelectors";

const AUTOCOMMIT_POLL_DELAY = 1000;
const AUTOCOMMIT_WHITELISTED_STATES = [
  AutocommitStatusState.PUBLISHED,
  AutocommitStatusState.IN_PROGRESS,
  AutocommitStatusState.LOCKED,
];

interface PollAutocommitProgressParams {
  artifactDef: GitArtifactDef;
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
  const { artifactDef, artifactId } = params;
  let triggerResponse: TriggerAutocommitResponse | undefined;

  try {
    const isGitApiContractsEnabled: boolean = yield select(
      selectGitApiContractsEnabled,
    );

    triggerResponse = yield call(
      triggerAutocommitRequest,
      artifactDef.artifactType,
      artifactId,
      isGitApiContractsEnabled,
    );
    const isValidResponse: boolean = yield validateResponse(triggerResponse);

    if (triggerResponse && isValidResponse) {
      yield put(gitArtifactActions.triggerAutocommitSuccess({ artifactDef }));
    }
  } catch (e) {
    if (triggerResponse && triggerResponse.responseMeta.error) {
      const { error } = triggerResponse.responseMeta;

      yield put(
        gitArtifactActions.triggerAutocommitError({ artifactDef, error }),
      );
    } else {
      log.error(e);
      captureException(e);
    }
  }

  let progressResponse: FetchAutocommitProgressResponse | null = null;

  try {
    if (isAutocommitHappening(triggerResponse?.data)) {
      yield put(
        gitArtifactActions.pollAutocommitProgressStart({ artifactDef }),
      );

      while (true) {
        yield put(
          gitArtifactActions.fetchAutocommitProgressInit({ artifactDef }),
        );

        const isGitApiContractsEnabled: boolean = yield select(
          selectGitApiContractsEnabled,
        );

        progressResponse = yield call(
          fetchAutocommitProgressRequest,
          artifactDef.artifactType,
          artifactDef.baseArtifactId,
          isGitApiContractsEnabled,
        );
        const isValidResponse: boolean =
          yield validateResponse(progressResponse);

        if (isValidResponse && !isAutocommitHappening(progressResponse?.data)) {
          yield put(
            gitArtifactActions.pollAutocommitProgressStop({ artifactDef }),
          );
        }

        if (!isValidResponse) {
          yield put(
            gitArtifactActions.pollAutocommitProgressStop({ artifactDef }),
          );
        }

        yield delay(AUTOCOMMIT_POLL_DELAY);
      }
    } else {
      yield put(gitArtifactActions.pollAutocommitProgressStop({ artifactDef }));
    }
  } catch (e) {
    yield put(gitArtifactActions.pollAutocommitProgressStop({ artifactDef }));

    if (progressResponse && progressResponse.responseMeta.error) {
      const { error } = progressResponse.responseMeta;

      yield put(
        gitArtifactActions.fetchAutocommitProgressError({
          artifactDef,
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
  const { artifactDef, artifactId } = action.payload;
  const isAutocommitEnabled: boolean = yield select(
    selectAutocommitEnabled,
    artifactDef,
  );

  if (isAutocommitEnabled) {
    const params = { artifactDef, artifactId };
    const pollTask: Task = yield fork(pollAutocommitProgressSaga, params);

    yield take(gitArtifactActions.pollAutocommitProgressStop.type);
    yield cancel(pollTask);
  } else {
    yield put(triggerAutocommitSuccessAction());
  }
}
