export enum AUTH_TYPE {
  SSH = "SSH",
  HTTPS = "HTTPS",
}

export const AUTH_TYPE_OPTIONS = [
  { label: AUTH_TYPE.SSH, value: AUTH_TYPE.SSH },
  { label: AUTH_TYPE.HTTPS, value: AUTH_TYPE.HTTPS },
];
export const Classes = {
  GIT_SYNC_MODAL: "git-sync-modal",
  DISCONNECT_GIT_MODAL: "disconnect-git-modal",
  OPTION_SELECTOR_WRAPPER: "option-wrapper",
  MERGE_DROPDOWN: "merge-dropdown",
  GIT_IMPORT_MODAL: "git-import-modal",
  RECONNECT_DATASOURCE_MODAL: "reconnect-datasource-modal",
};

export const MENU_HEIGHT = 46;

export enum CREDENTIAL_MODE {
  MANUALLY = "MANUALLY",
  IMPORT_JSON = "IMPORT_JSON",
}

export const REMOTE_BRANCH_PREFIX = "origin/";
