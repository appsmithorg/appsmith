import {
  createMessage,
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
  CONNECT_TO_GIT,
  DEPLOY_YOUR_APPLICATION,
  MERGE_CHANGES,
} from "@appsmith/constants/messages";
import { GitSyncModalTab } from "entities/GitSync";

export const MENU_ITEMS_MAP = {
  [GitSyncModalTab.GIT_CONNECTION]: {
    key: GitSyncModalTab.GIT_CONNECTION,
    title: createMessage(GIT_CONNECTION),
    modalTitle: createMessage(CONNECT_TO_GIT),
  },
  [GitSyncModalTab.DEPLOY]: {
    key: GitSyncModalTab.DEPLOY,
    title: createMessage(DEPLOY),
    modalTitle: createMessage(DEPLOY_YOUR_APPLICATION),
  },
  [GitSyncModalTab.MERGE]: {
    key: GitSyncModalTab.MERGE,
    title: createMessage(MERGE),
    modalTitle: createMessage(MERGE_CHANGES),
  },
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
  GIT_IMPORT_MODAL: "git-import-modal",
  RECONNECT_DATASOURCE_MODAL: "reconnect-datasource-modal",
};

export const MENU_HEIGHT = 46;

export enum CREDENTIAL_MODE {
  MANUALLY = "MANUALLY",
  IMPORT_JSON = "IMPORT_JSON",
}
