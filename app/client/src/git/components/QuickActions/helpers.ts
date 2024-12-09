import {
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  CONFLICTS_FOUND,
  createMessage,
  NO_COMMITS_TO_PULL,
  PULL_CHANGES,
} from "ee/constants/messages";
import type { GitStatus } from "../../types";

export const getPullBtnStatus = (
  gitStatus: GitStatus,
  pullFailed: boolean,
  isProtected: boolean,
) => {
  const { behindCount, isClean } = gitStatus;
  let message = createMessage(NO_COMMITS_TO_PULL);
  let disabled = behindCount === 0;

  if (!isClean && !isProtected) {
    disabled = true;
    message = createMessage(CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES);
    // TODO: Remove this when gitStatus typings are finalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
  } else if (!isClean && isProtected && behindCount > 0) {
    disabled = false;
    message = createMessage(PULL_CHANGES);
  } else if (pullFailed) {
    message = createMessage(CONFLICTS_FOUND);
    // TODO: Remove this when gitStatus typings are finalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
  } else if (behindCount > 0) {
    message = createMessage(PULL_CHANGES);
  }

  return {
    disabled,
    message,
  };
};

export const capitalizeFirstLetter = (string = " ") => {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};
