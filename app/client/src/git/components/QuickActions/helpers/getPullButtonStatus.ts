import {
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  CONFLICTS_FOUND,
  createMessage,
  NO_COMMITS_TO_PULL,
  PULL_CHANGES,
} from "ee/constants/messages";

export interface GetPullButtonStatusParams {
  isProtectedMode: boolean;
  isStatusClean: boolean;
  isPullFailing: boolean;
  statusBehindCount: number;
}

const getPullBtnStatus = ({
  isProtectedMode = false,
  isPullFailing = false,
  isStatusClean = false,
  statusBehindCount = 0,
}: GetPullButtonStatusParams) => {
  let message = createMessage(NO_COMMITS_TO_PULL);
  let isDisabled = statusBehindCount === 0;

  if (!isStatusClean && !isProtectedMode) {
    isDisabled = true;
    message = createMessage(CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES);
  } else if (!isStatusClean && isProtectedMode && statusBehindCount > 0) {
    isDisabled = false;
    message = createMessage(PULL_CHANGES);
  } else if (isPullFailing) {
    message = createMessage(CONFLICTS_FOUND);
  } else if (statusBehindCount > 0) {
    message = createMessage(PULL_CHANGES);
  }

  return {
    isDisabled,
    message,
  };
};

export default getPullBtnStatus;
