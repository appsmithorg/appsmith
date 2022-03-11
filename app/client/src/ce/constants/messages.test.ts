import { createMessage, ERROR_WIDGET_COPY_NOT_ALLOWED } from "./messages";

import {
  COMMIT_CHANGES,
  COMMIT_TO,
  COMMIT_AND_PUSH,
  PULL_CHANGES,
  DEPLOY_KEY_TITLE,
  REGENERATE_SSH_KEY,
  SSH_KEY,
  COPY_SSH_KEY,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  COMMITTING_AND_PUSHING_CHANGES,
  IS_MERGING,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
  CONNECT_GIT,
  CONNECT_GIT_BETA,
  RETRY,
  CREATE_NEW_BRANCH,
  ERROR_WHILE_PULLING_CHANGES,
  SUBMIT,
  GIT_USER_UPDATED_SUCCESSFULLY,
  REMOTE_URL_INPUT_PLACEHOLDER,
  COPIED_SSH_KEY,
  INVALID_USER_DETAILS_MSG,
  PASTE_SSH_URL_INFO,
  GENERATE_KEY,
  UPDATE_CONFIG,
  CONNECT_BTN_LABEL,
  FETCH_GIT_STATUS,
  FETCH_MERGE_STATUS,
  NO_MERGE_CONFLICT,
  MERGE_CONFLICT_ERROR,
  FETCH_MERGE_STATUS_FAILURE,
  GIT_UPSTREAM_CHANGES,
  GIT_CONFLICTING_INFO,
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  DISCONNECT_EXISTING_REPOSITORIES,
  DISCONNECT_EXISTING_REPOSITORIES_INFO,
  CONTACT_SUPPORT,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  NONE_REVERSIBLE_MESSAGE,
  CONTACT_SUPPORT_TO_UPGRADE,
  DISCONNECT_CAUSE_APPLICATION_BREAK,
  DISCONNECT_GIT,
  DISCONNECT,
  GIT_DISCONNECTION_SUBMENU,
} from "./messages";

describe("messages", () => {
  it("checks for ERROR_WIDGET_COPY_NOT_ALLOWED string", () => {
    expect(ERROR_WIDGET_COPY_NOT_ALLOWED()).toBe(
      "This selected widget cannot be copied.",
    );
  });
});

describe("git-sync messages", () => {
  const expectedMessages = [
    { key: "COMMIT_CHANGES", value: "Commit changes" },
    { key: "COMMIT_TO", value: "Commit to" },
    { key: "COMMIT_AND_PUSH", value: "Commit & push" },
    { key: "PULL_CHANGES", value: "PULL CHANGES" },
    { key: "DEPLOY_KEY_TITLE", value: "Deployed Key" },

    { key: "REGENERATE_SSH_KEY", value: "Regenerate SSH Key" },
    { key: "SSH_KEY", value: "SSH Key" },
    { key: "COPY_SSH_KEY", value: "Copy SSH Key" },
    {
      key: "REGENERATE_KEY_CONFIRM_MESSAGE",
      value:
        "This might cause the application to break. This keys needs to be updated in your Git Repo too!",
    },
    {
      key: "DEPLOY_KEY_USAGE_GUIDE_MESSAGE",
      value:
        "Paste this key in your repository settings and give it write access.",
    },
    {
      key: "COMMITTING_AND_PUSHING_CHANGES",
      value: "COMMITTING AND PUSHING CHANGES...",
    },
    { key: "IS_MERGING", value: "MERGING CHANGES..." },
    { key: "MERGE_CHANGES", value: "Merge changes" },
    { key: "SELECT_BRANCH_TO_MERGE", value: "Select branch to merge" },
    { key: "CONNECT_GIT", value: "Connect Git" },
    { key: "CONNECT_GIT_BETA", value: "Connect Git (Beta)" },
    { key: "RETRY", value: "RETRY" },
    { key: "CREATE_NEW_BRANCH", value: "CREATE NEW BRANCH" },
    {
      key: "ERROR_WHILE_PULLING_CHANGES",
      value: "ERROR WHILE PULLING CHANGES",
    },
    { key: "SUBMIT", value: "SUBMIT" },
    {
      key: "GIT_USER_UPDATED_SUCCESSFULLY",
      value: "Git user updated successfully",
    },
    { key: "REMOTE_URL_INPUT_PLACEHOLDER", value: "Paste Your URL here" },
    { key: "COPIED_SSH_KEY", value: "Copied SSH Key" },
    {
      key: "INVALID_USER_DETAILS_MSG",
      value: "Please enter valid user details",
    },
    {
      key: "PASTE_SSH_URL_INFO",
      value: "Please enter valid SSH URL of your repository",
    },
    { key: "GENERATE_KEY", value: "Generate Key" },
    { key: "UPDATE_CONFIG", value: "UPDATE CONFIG" },
    { key: "CONNECT_BTN_LABEL", value: "CONNECT" },
    { key: "FETCH_GIT_STATUS", value: "fetching status..." },
    { key: "FETCH_MERGE_STATUS", value: "Checking mergeability..." },
    {
      key: "NO_MERGE_CONFLICT",
      value: "This branch has no conflict with the base branch.",
    },
    { key: "MERGE_CONFLICT_ERROR", value: "Merge conflicts found!" },
    {
      key: "FETCH_MERGE_STATUS_FAILURE",
      value: "Unable to fetch merge status",
    },
    {
      key: "GIT_UPSTREAM_CHANGES",
      value:
        "Looks like there are pending upstream changes. We will pull the changes and push them to your repo.",
    },
    {
      key: "GIT_CONFLICTING_INFO",
      value: "Please resolve the conflicts manually on your repository.",
    },
    {
      key: "CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES",
      value:
        "You have uncommitted changes. Please commit before pulling the remote changes",
    },
    {
      key: "CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES",
      value:
        "Your current branch has uncommitted changes. Please commit before proceeding to merge",
    },
    {
      key: "DISCONNECT_EXISTING_REPOSITORIES",
      value: "Disconnect existing Repositories",
    },
    {
      key: "DISCONNECT_EXISTING_REPOSITORIES_INFO",
      value:
        "To make space for newer repositories you can remove existing repositories.",
    },
    { key: "CONTACT_SUPPORT", value: "Contact Support" },
    { key: "REPOSITORY_LIMIT_REACHED", value: "Repository Limit Reached" },
    {
      key: "REPOSITORY_LIMIT_REACHED_INFO",
      value:
        "Adding and using upto 3 repositories is free. To add more repositories kindly upgrade.",
    },
    {
      key: "NONE_REVERSIBLE_MESSAGE",
      value: "This action is non reversible. Proceed with caution",
    },
    {
      key: "CONTACT_SUPPORT_TO_UPGRADE",
      value:
        "Contact support to upgrade. You can add unlimited private repositories in upgraded plan.",
    },
    {
      key: "DISCONNECT_CAUSE_APPLICATION_BREAK",
      value: "Disconnect might cause the application to break.",
    },
    { key: "DISCONNECT_GIT", value: "Disconnect git" },
    { key: "DISCONNECT", value: "DISCONNECT" },
    { key: "GIT_DISCONNECTION_SUBMENU", value: "Git Connection > Disconnect" },
  ];
  const functions = [
    COMMIT_CHANGES,
    COMMIT_TO,
    COMMIT_AND_PUSH,
    PULL_CHANGES,
    DEPLOY_KEY_TITLE,
    REGENERATE_SSH_KEY,
    SSH_KEY,
    COPY_SSH_KEY,
    REGENERATE_KEY_CONFIRM_MESSAGE,
    DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
    COMMITTING_AND_PUSHING_CHANGES,
    IS_MERGING,
    MERGE_CHANGES,
    SELECT_BRANCH_TO_MERGE,
    CONNECT_GIT,
    CONNECT_GIT_BETA,
    RETRY,
    CREATE_NEW_BRANCH,
    ERROR_WHILE_PULLING_CHANGES,
    SUBMIT,
    GIT_USER_UPDATED_SUCCESSFULLY,
    REMOTE_URL_INPUT_PLACEHOLDER,
    COPIED_SSH_KEY,
    INVALID_USER_DETAILS_MSG,
    PASTE_SSH_URL_INFO,
    GENERATE_KEY,
    UPDATE_CONFIG,
    CONNECT_BTN_LABEL,
    FETCH_GIT_STATUS,
    FETCH_MERGE_STATUS,
    NO_MERGE_CONFLICT,
    MERGE_CONFLICT_ERROR,
    FETCH_MERGE_STATUS_FAILURE,
    GIT_UPSTREAM_CHANGES,
    GIT_CONFLICTING_INFO,
    CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
    CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
    DISCONNECT_EXISTING_REPOSITORIES,
    DISCONNECT_EXISTING_REPOSITORIES_INFO,
    CONTACT_SUPPORT,
    REPOSITORY_LIMIT_REACHED,
    REPOSITORY_LIMIT_REACHED_INFO,
    NONE_REVERSIBLE_MESSAGE,
    CONTACT_SUPPORT_TO_UPGRADE,
    DISCONNECT_CAUSE_APPLICATION_BREAK,
    DISCONNECT_GIT,
    DISCONNECT,
    GIT_DISCONNECTION_SUBMENU,
  ];
  functions.forEach((fn: () => string) => {
    it(`${fn.name} returns expected value`, () => {
      const actual = createMessage(fn);
      const found = expectedMessages.find((em) => em.key === fn.name);
      const expected = found && found.value;
      expect(actual).toEqual(expected);
    });
  });
});
