import { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import {
  CHANGES_ONLY_MIGRATION,
  CHANGES_ONLY_USER,
  CHANGES_USER_AND_MIGRATION,
  createMessage,
} from "@appsmith/constants/messages";

export const getIsStartingWithRemoteBranches = (
  local: string,
  remote: string,
) => {
  const remotePrefix = "origin/";

  return (
    local &&
    !local.startsWith(remotePrefix) &&
    remote &&
    remote.startsWith(remotePrefix)
  );
};

const GIT_REMOTE_URL_PATTERN = /^((git|ssh)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:\/\-~]+)[^\/]$/im;

const gitRemoteUrlRegExp = new RegExp(GIT_REMOTE_URL_PATTERN);

/**
 * isValidGitRemoteUrl: returns true if a url follows valid SSH/git url scheme, see GIT_REMOTE_URL_PATTERN
 * @param url {string} remote url input
 * @returns {boolean} true if valid remote url, false otherwise
 */
export const isValidGitRemoteUrl = (url: string) =>
  gitRemoteUrlRegExp.test(url);

/**
 * isRemoteBranch: returns true if a branch name starts with origin/
 * @param name {string} branch name
 * @returns {boolean}
 */
export const isRemoteBranch = (name: string): boolean =>
  name.startsWith("origin/");

/**
 * isLocalBranch: returns true if a branch name doesn't start with origin/
 * @param name {string} branch name
 * @returns {boolean}
 */
export const isLocalBranch = (name: string): boolean => !isRemoteBranch(name);

export const getIsActiveItem = (
  isCreateNewBranchInputValid: boolean,
  activeHoverIndex: number,
  index: number,
) =>
  (isCreateNewBranchInputValid ? activeHoverIndex - 1 : activeHoverIndex) ===
  index;

/**
 * removeSpecialChars: removes non-word ([^A-Za-z0-9_]) characters except / and - from input string
 * @param input {string} string containing non-word characters e.g. name of the branch
 * @returns {string}
 */
export const removeSpecialChars = (input: string): string => {
  const separatorRegex = /(?![/-])\W+/;
  return input.split(separatorRegex).join("_");
};

/**
 * changeInfoSinceLastCommit: Returns reason for change string, and whether the changes are from migration or user or both.
 * @param currentApplication {ApplicationPayload | undefined}
 * @returns {{changeReasonText: string, isAutoUpdate:boolean, isManualUpdate: boolean}}
 */
export function changeInfoSinceLastCommit(
  currentApplication: ApplicationPayload | undefined,
) {
  const isAutoUpdate = !!currentApplication?.isAutoUpdate;
  const isManualUpdate = !!currentApplication?.isManualUpdate;
  const changeReason = isAutoUpdate
    ? isManualUpdate
      ? CHANGES_USER_AND_MIGRATION
      : CHANGES_ONLY_MIGRATION
    : CHANGES_ONLY_USER;
  const changeReasonText = createMessage(changeReason);
  return { isAutoUpdate, isManualUpdate, changeReasonText };
}
