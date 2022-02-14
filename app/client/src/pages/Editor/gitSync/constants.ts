import {
  createMessage,
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
} from "@appsmith/constants/messages";

export enum MENU_ITEM {
  GIT_CONNECTION = "GIT_CONNECTION",
  DEPLOY = "DEPLOY",
  MERGE = "MERGE",
}

export const MENU_ITEMS_MAP = {
  [MENU_ITEM.GIT_CONNECTION]: {
    key: MENU_ITEM.GIT_CONNECTION,
    title: createMessage(GIT_CONNECTION),
  },
  [MENU_ITEM.DEPLOY]: { key: MENU_ITEM.DEPLOY, title: createMessage(DEPLOY) },
  [MENU_ITEM.MERGE]: { key: MENU_ITEM.MERGE, title: createMessage(MERGE) },
  // Hide Merge Tab till basic functionality is not ready
};

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
};

export const DEFAULT_REMOTE = "origin";
export const MENU_HEIGHT = 47;
