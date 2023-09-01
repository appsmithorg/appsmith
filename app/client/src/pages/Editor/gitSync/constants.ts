import {
  DEPLOY,
  DEPLOY_YOUR_APPLICATION,
  MERGE,
  MERGE_CHANGES,
  // SETTINGS_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import { GitSyncModalTab } from "entities/GitSync";

export enum AUTH_TYPE {
  SSH = "SSH",
  HTTPS = "HTTPS",
}

export const MENU_ITEMS_MAP: Record<string, any> = {
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
  // [GitSyncModalTab.SETTINGS]: {
  //   key: GitSyncModalTab.SETTINGS,
  //   title: createMessage(SETTINGS_GIT),
  //   modalTitle: createMessage(SETTINGS_GIT),
  // },
};

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
