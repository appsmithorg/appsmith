import {
  ARE_YOU_SURE,
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  CHANGES_ONLY_MIGRATION,
  CHANGES_ONLY_USER,
  CHANGES_USER_AND_MIGRATION,
  COMMIT_AND_PUSH,
  COMMIT_CHANGES,
  COMMIT_TO,
  COMMITTING_AND_PUSHING_CHANGES,
  CONNECT_BTN_LABEL,
  CONNECT_GIT,
  CONNECT_GIT_BETA,
  CONNECT_TO_GIT,
  CONNECT_TO_GIT_SUBTITLE,
  CONTACT_SUPPORT,
  CONTACT_SUPPORT_TO_UPGRADE,
  COPIED_SSH_KEY,
  COPY_SSH_KEY,
  CREATE_NEW_BRANCH,
  createMessage,
  DEPLOY,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  DISCARD_CHANGES,
  DISCARD_CHANGES_WARNING,
  DISCARD_SUCCESS,
  DISCARDING_AND_PULLING_CHANGES,
  DISCONNECT,
  REVOKE_CAUSE_APPLICATION_BREAK,
  REVOKE_EXISTING_REPOSITORIES_INFO,
  REVOKE_GIT,
  ERROR_GIT_AUTH_FAIL,
  ERROR_GIT_INVALID_REMOTE,
  ERROR_WHILE_PULLING_CHANGES,
  ERROR_WIDGET_COPY_NOT_ALLOWED,
  FETCH_GIT_STATUS,
  FETCH_MERGE_STATUS,
  FETCH_MERGE_STATUS_FAILURE,
  GENERATE_KEY,
  GIT_COMMIT_MESSAGE_PLACEHOLDER,
  GIT_CONFLICTING_INFO,
  GIT_CONNECTION,
  GIT_DISCONNECTION_SUBMENU,
  GIT_SETTINGS,
  GIT_UPSTREAM_CHANGES,
  GIT_USER_UPDATED_SUCCESSFULLY,
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_GIT_MESSAGE,
  IMPORT_FROM_GIT_REPOSITORY,
  IMPORTING_APP_FROM_GIT,
  INVALID_USER_DETAILS_MSG,
  IS_MERGING,
  MERGE,
  MERGE_CHANGES,
  MERGE_CONFLICT_ERROR,
  MERGED_SUCCESSFULLY,
  NO_MERGE_CONFLICT,
  NONE_REVERSIBLE_MESSAGE,
  PASTE_SSH_URL_INFO,
  PULL_CHANGES,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  REGENERATE_SSH_KEY,
  REMOTE_URL,
  REMOTE_URL_INFO,
  REMOTE_URL_INPUT_PLACEHOLDER,
  REMOTE_URL_VIA,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  RETRY,
  REVOKE_EXISTING_REPOSITORIES,
  SELECT_BRANCH_TO_MERGE,
  SSH_KEY,
  SUBMIT,
  UPDATE_CONFIG,
  UPLOADING_APPLICATION,
  UPLOADING_JSON,
  USE_DEFAULT_CONFIGURATION,
  AUDIT_LOGS,
  INTRODUCING,
  AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING,
  SECURITY_AND_COMPLIANCE,
  SECURITY_AND_COMPLIANCE_DETAIL1,
  SECURITY_AND_COMPLIANCE_DETAIL2,
  DEBUGGING,
  DEBUGGING_DETAIL1,
  INCIDENT_MANAGEMENT,
  INCIDENT_MANAGEMENT_DETAIL1,
  AVAILABLE_ON_BUSINESS,
  EXCLUSIVE_TO_BUSINESS,
} from "./messages";

describe("messages", () => {
  it("checks for ERROR_WIDGET_COPY_NOT_ALLOWED string", () => {
    expect(ERROR_WIDGET_COPY_NOT_ALLOWED()).toBe(
      "This selected widget cannot be copied.",
    );
  });
});

describe("messages without input", () => {
  const expectedMessages = [
    { key: "COMMIT_CHANGES", value: "Commit changes" },
    {
      key: "COMMIT_TO",
      value: "Commit to",
    },
    { key: "COMMIT_AND_PUSH", value: "Commit & push" },
    {
      key: "PULL_CHANGES",
      value: "Pull changes",
    },
    { key: "SSH_KEY", value: "SSH key" },
    {
      key: "COPY_SSH_KEY",
      value: "Copy SSH key",
    },
    {
      key: "REGENERATE_KEY_CONFIRM_MESSAGE",
      value:
        "This might cause the application to break. This key needs to be updated in your Git repository too!",
    },
    {
      key: "DEPLOY_KEY_USAGE_GUIDE_MESSAGE",
      value:
        "Paste this key in your repository settings and give it write access.",
    },
    {
      key: "COMMITTING_AND_PUSHING_CHANGES",
      value: "Committing and pushing changes...",
    },
    { key: "IS_MERGING", value: "Merging changes..." },
    {
      key: "MERGE_CHANGES",
      value: "Merge changes",
    },
    { key: "SELECT_BRANCH_TO_MERGE", value: "Select branch to merge" },
    {
      key: "CONNECT_GIT",
      value: "Connect Git",
    },
    { key: "CONNECT_GIT_BETA", value: "Connect Git (Beta)" },
    {
      key: "RETRY",
      value: "Retry",
    },
    { key: "CREATE_NEW_BRANCH", value: "Create new branch" },
    {
      key: "ERROR_WHILE_PULLING_CHANGES",
      value: "ERROR WHILE PULLING CHANGES",
    },
    { key: "SUBMIT", value: "Submit" },
    {
      key: "GIT_USER_UPDATED_SUCCESSFULLY",
      value: "Git user updated successfully",
    },
    {
      key: "REMOTE_URL_INPUT_PLACEHOLDER",
      value: "git@example.com:user/repository.git",
    },
    { key: "COPIED_SSH_KEY", value: "Copied SSH key" },
    {
      key: "INVALID_USER_DETAILS_MSG",
      value: "Please enter valid user details",
    },
    {
      key: "PASTE_SSH_URL_INFO",
      value: "Please enter a valid SSH URL of your repository",
    },
    { key: "GENERATE_KEY", value: "Generate key" },
    {
      key: "UPDATE_CONFIG",
      value: "Update config",
    },
    { key: "CONNECT_BTN_LABEL", value: "Connect" },
    {
      key: "FETCH_GIT_STATUS",
      value: "Fetching status...",
    },
    { key: "FETCH_MERGE_STATUS", value: "Checking mergeability..." },
    {
      key: "NO_MERGE_CONFLICT",
      value: "This branch has no conflicts with the base branch.",
    },
    { key: "MERGE_CONFLICT_ERROR", value: "Merge conflicts found!" },
    {
      key: "FETCH_MERGE_STATUS_FAILURE",
      value: "Unable to fetch merge status",
    },
    {
      key: "GIT_UPSTREAM_CHANGES",
      value:
        "Looks like there are pending upstream changes. We will pull the changes and push them to your repository.",
    },
    {
      key: "GIT_CONFLICTING_INFO",
      value: "Please resolve the merge conflicts manually on your repository.",
    },
    {
      key: "CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES",
      value:
        "You have uncommitted changes. Please commit before pulling the remote changes.",
    },
    {
      key: "CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES",
      value:
        "Your current branch has uncommitted changes. Please commit them before proceeding to merge.",
    },
    {
      key: "REVOKE_EXISTING_REPOSITORIES",
      value: "Revoke existing repositories",
    },
    {
      key: "REVOKE_EXISTING_REPOSITORIES_INFO",
      value:
        "To make space for newer repositories, you can remove existing repositories.",
    },
    { key: "CONTACT_SUPPORT", value: "Contact support" },
    {
      key: "REPOSITORY_LIMIT_REACHED",
      value: "Repository limit reached",
    },
    {
      key: "REPOSITORY_LIMIT_REACHED_INFO",
      value:
        "Adding and using upto 3 repositories is free. To add more repositories, kindly upgrade.",
    },
    {
      key: "NONE_REVERSIBLE_MESSAGE",
      value: "This action is non-reversible. Please proceed with caution.",
    },
    {
      key: "CONTACT_SUPPORT_TO_UPGRADE",
      value:
        "Please contact support to upgrade. You can add unlimited private repositories in upgraded plan.",
    },
    {
      key: "REVOKE_CAUSE_APPLICATION_BREAK",
      value: "Revoking your repository might cause the application to break.",
    },
    { key: "REVOKE_GIT", value: "Revoke access" },
    {
      key: "DISCONNECT",
      value: "Disconnect",
    },
    { key: "GIT_DISCONNECTION_SUBMENU", value: "Git Connection > Disconnect" },
    {
      key: "USE_DEFAULT_CONFIGURATION",
      value: "Use default configuration",
    },
    {
      key: "GIT_COMMIT_MESSAGE_PLACEHOLDER",
      value: "Your commit message here",
    },
    { key: "GIT_CONNECTION", value: "Git connection" },
    { key: "DEPLOY", value: "Deploy" },
    {
      key: "MERGE",
      value: "Merge",
    },
    { key: "GIT_SETTINGS", value: "Git settings" },
    { key: "CONNECT_TO_GIT", value: "Connect to Git repository" },
    {
      key: "CONNECT_TO_GIT_SUBTITLE",
      value: "Checkout branches, make commits, and deploy your application",
    },
    { key: "REMOTE_URL", value: "Remote URL" },
    {
      key: "REMOTE_URL_INFO",
      value: `Create an empty Git repository and paste the remote URL here.`,
    },
    { key: "REMOTE_URL_VIA", value: "Remote URL via" },
    {
      key: "ERROR_GIT_AUTH_FAIL",
      value:
        "Please make sure that regenerated SSH key is added and has write access to the repository.",
    },
    {
      key: "ERROR_GIT_INVALID_REMOTE",
      value: "Either the remote repository doesn't exist or is unreachable.",
    },
    {
      key: "CHANGES_ONLY_USER",
      value: "Changes since last commit",
    },
    {
      key: "CHANGES_ONLY_MIGRATION",
      value: "Appsmith update changes since last commit",
    },
    {
      key: "CHANGES_USER_AND_MIGRATION",
      value: "Appsmith update and user changes since last commit",
    },
    { key: "MERGED_SUCCESSFULLY", value: "Merged successfully" },
    {
      key: "DISCARD_CHANGES_WARNING",
      value:
        "This action will replace your local changes with the latest remote version.",
    },
    {
      key: "DISCARD_SUCCESS",
      value: "Discarded changes successfully.",
    },
    {
      key: "DISCARDING_AND_PULLING_CHANGES",
      value: "Discarding and pulling changes...",
    },
    {
      key: "ARE_YOU_SURE",
      value: "Are you sure?",
    },
    {
      key: "DISCARD_CHANGES",
      value: "Discard & pull",
    },
    {
      key: "IMPORTING_APP_FROM_GIT",
      value: "Importing application from Git",
    },
    { key: "UPLOADING_JSON", value: "Uploading JSON file" },
    {
      key: "UPLOADING_APPLICATION",
      value: "Uploading application",
    },
    {
      key: "IMPORT_APP_FROM_FILE_MESSAGE",
      value: "Drag and drop your file or upload from your computer",
    },
    {
      key: "IMPORT_APP_FROM_GIT_MESSAGE",
      value: "Import an application from its Git repository using its SSH URL",
    },
    {
      key: "IMPORT_FROM_GIT_REPOSITORY",
      value: "Import from Git repository",
    },
  ];
  const functions = [
    ARE_YOU_SURE,
    CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
    CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
    CHANGES_ONLY_MIGRATION,
    CHANGES_ONLY_USER,
    CHANGES_USER_AND_MIGRATION,
    COMMITTING_AND_PUSHING_CHANGES,
    COMMIT_AND_PUSH,
    COMMIT_CHANGES,
    COMMIT_TO,
    CONNECT_BTN_LABEL,
    CONNECT_GIT,
    CONNECT_GIT_BETA,
    CONNECT_TO_GIT,
    CONNECT_TO_GIT_SUBTITLE,
    CONTACT_SUPPORT,
    CONTACT_SUPPORT_TO_UPGRADE,
    COPIED_SSH_KEY,
    COPY_SSH_KEY,
    CREATE_NEW_BRANCH,
    DEPLOY,
    DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
    DISCARDING_AND_PULLING_CHANGES,
    DISCARD_CHANGES,
    DISCARD_CHANGES_WARNING,
    DISCARD_SUCCESS,
    DISCONNECT,
    REVOKE_CAUSE_APPLICATION_BREAK,
    REVOKE_EXISTING_REPOSITORIES,
    REVOKE_EXISTING_REPOSITORIES_INFO,
    REVOKE_GIT,
    ERROR_GIT_AUTH_FAIL,
    ERROR_GIT_INVALID_REMOTE,
    ERROR_WHILE_PULLING_CHANGES,
    FETCH_GIT_STATUS,
    FETCH_MERGE_STATUS,
    FETCH_MERGE_STATUS_FAILURE,
    GENERATE_KEY,
    GIT_COMMIT_MESSAGE_PLACEHOLDER,
    GIT_CONFLICTING_INFO,
    GIT_CONNECTION,
    GIT_DISCONNECTION_SUBMENU,
    GIT_SETTINGS,
    GIT_UPSTREAM_CHANGES,
    GIT_USER_UPDATED_SUCCESSFULLY,
    IMPORTING_APP_FROM_GIT,
    INVALID_USER_DETAILS_MSG,
    IS_MERGING,
    MERGE,
    MERGE_CHANGES,
    MERGE_CONFLICT_ERROR,
    NONE_REVERSIBLE_MESSAGE,
    NO_MERGE_CONFLICT,
    MERGED_SUCCESSFULLY,
    PASTE_SSH_URL_INFO,
    PULL_CHANGES,
    REGENERATE_KEY_CONFIRM_MESSAGE,
    REMOTE_URL,
    REMOTE_URL_INFO,
    REMOTE_URL_INPUT_PLACEHOLDER,
    REMOTE_URL_VIA,
    REPOSITORY_LIMIT_REACHED,
    REPOSITORY_LIMIT_REACHED_INFO,
    RETRY,
    SELECT_BRANCH_TO_MERGE,
    SSH_KEY,
    SUBMIT,
    UPDATE_CONFIG,
    USE_DEFAULT_CONFIGURATION,
    UPLOADING_JSON,
    UPLOADING_APPLICATION,
    IMPORT_APP_FROM_FILE_MESSAGE,
    IMPORT_APP_FROM_GIT_MESSAGE,
    IMPORT_FROM_GIT_REPOSITORY,
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

describe("messages with input values", () => {
  it("REGENERATE_SSH_KEY returns expected value", () => {
    expect(createMessage(REGENERATE_SSH_KEY)).toEqual(
      "Regenerate undefined undefined key",
    );
    expect(createMessage(REGENERATE_SSH_KEY, "ECDSA", 256)).toEqual(
      "Regenerate ECDSA 256 key",
    );
  });
});

describe("Audit logs messages", () => {
  it("without input strings match successfully", () => {
    const input = [
      AUDIT_LOGS,
      AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING,
      SECURITY_AND_COMPLIANCE,
      SECURITY_AND_COMPLIANCE_DETAIL1,
      SECURITY_AND_COMPLIANCE_DETAIL2,
      DEBUGGING,
      DEBUGGING_DETAIL1,
      INCIDENT_MANAGEMENT,
      INCIDENT_MANAGEMENT_DETAIL1,
      AVAILABLE_ON_BUSINESS,
    ];
    const expected = [
      "Audit logs",
      "See a timestamped trail of events in your workspace. Filter by type of event, user, resource ID, and time. Drill down into each event to investigate further.",
      "Security & compliance",
      "Proactively derisk misconfigured permissions, roll back changes from a critical security event, and keep checks against your compliance policies.",
      "Exports to popular compliance tools coming soon",
      "Debugging",
      "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.",
      "Incident management",
      "Go back in time from an incident to see who did what, correlate events with breaking changes, and run RCAs to remediate incidents for now and the future.",
      "Available on a business plan only",
    ];
    const actual = input.map((f) => createMessage(f));
    expect(actual).toEqual(expected);
  });
  it("with input strings match successfully", () => {
    const input = [INTRODUCING, EXCLUSIVE_TO_BUSINESS];
    const expected = [
      `Introducing XYZ`,
      `The XYZ feature is exclusive to workspaces on the Business Edition`,
    ];
    const actual = input.map((f) => createMessage(f, "XYZ"));
    expect(actual).toEqual(expected);
  });
});
