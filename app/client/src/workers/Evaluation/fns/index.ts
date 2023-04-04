import type {
  TNavigateToActionType,
  TNavigateToDescription,
} from "./navigateTo";
import navigateTo from "./navigateTo";
import type { TShowAlertActionType, TShowAlertDescription } from "./showAlert";
import showAlert from "./showAlert";
import type {
  TCloseModalActionType,
  TCloseModalDescription,
  TShowModalActionType,
  TShowModalDescription,
} from "./modalFns";
import { closeModal, showModal } from "./modalFns";
import type { TDownloadActionType, TDownloadDescription } from "./download";
import download from "./download";
import type {
  TPostWindowMessageActionType,
  TPostWindowMessageDescription,
} from "./postWindowMessage";
import postWindowMessage from "./postWindowMessage";
import type {
  TCopyToClipboardActionType,
  TCopyToClipboardDescription,
} from "./copyToClipboard";
import copyToClipboard from "./copyToClipboard";
import type {
  TResetWidgetActionType,
  TResetWidgetDescription,
} from "./resetWidget";
import resetWidget from "./resetWidget";
import type {
  TClearStoreDescription,
  TRemoveValueDescription,
  TStoreValueDescription,
} from "./storeFns";
import { clearStore, removeValue, storeValue } from "./storeFns";
import type {
  TClearActionType,
  TClearDescription,
  TRunActionType,
  TRunDescription,
} from "./actionFns";
import run, { clear } from "./actionFns";
import {
  isAction,
  isAppsmithEntity,
} from "ce/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import type {
  TGetGeoLocationActionType,
  TGetGeoLocationDescription,
  TStopWatchGeoLocationActionType,
  TStopWatchGeoLocationDescription,
  TWatchGeoLocationActionType,
  TWatchGeoLocationDescription,
} from "./geolocationFns";
import {
  getGeoLocation,
  stopWatchGeoLocation,
  watchGeoLocation,
} from "./geolocationFns";
import { isAsyncGuard } from "./utils/fnGuard";

// cloudHosting -> to use in EE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPlatformFunctions = (cloudHosting: boolean) => {
  return platformFns;
};

const platformFns = [
  {
    name: "navigateTo",
    fn: navigateTo,
  },
  {
    name: "showAlert",
    fn: showAlert,
  },
  {
    name: "showModal",
    fn: showModal,
  },
  {
    name: "closeModal",
    fn: closeModal,
  },
  {
    name: "download",
    fn: download,
  },
  {
    name: "postWindowMessage",
    fn: postWindowMessage,
  },
  {
    name: "copyToClipboard",
    fn: copyToClipboard,
  },
  {
    name: "resetWidget",
    fn: resetWidget,
  },
  {
    name: "storeValue",
    fn: storeValue,
  },
  {
    name: "removeValue",
    fn: removeValue,
  },
  {
    name: "clearStore",
    fn: clearStore,
  },
];

export const entityFns = [
  {
    name: "run",
    qualifier: (entity: DataTreeEntity) => isAction(entity),
    fn: (entity: DataTreeEntity, entityName: string) =>
      isAsyncGuard(run.bind(entity), `${entityName}.run`),
  },
  {
    name: "clear",
    qualifier: (entity: DataTreeEntity) => isAction(entity),
    fn: (entity: DataTreeEntity, entityName: string) =>
      isAsyncGuard(clear.bind(entity), `${entityName}.clear`),
  },
  {
    name: "getGeoLocation",
    path: "appsmith.geolocation.getCurrentPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      isAsyncGuard(getGeoLocation, "appsmith.geolocation.getCurrentPosition"),
  },
  {
    name: "watchGeoLocation",
    path: "appsmith.geolocation.watchPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      isAsyncGuard(watchGeoLocation, "appsmith.geolocation.watchPosition"),
  },
  {
    name: "stopWatchGeoLocation",
    path: "appsmith.geolocation.clearWatch",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      isAsyncGuard(stopWatchGeoLocation, "appsmith.geolocation.clearWatch"),
  },
];

export type ActionTriggerKeys =
  | TClearActionType
  | TRunActionType
  | TDownloadActionType
  | TShowModalActionType
  | TCloseModalActionType
  | TShowAlertActionType
  | TDownloadActionType
  | TNavigateToActionType
  | TResetWidgetActionType
  | TCopyToClipboardActionType
  | TPostWindowMessageActionType
  | TGetGeoLocationActionType
  | TWatchGeoLocationActionType
  | TStopWatchGeoLocationActionType;

export const getActionTriggerFunctionNames = (
  // cloudHosting -> to use in ee
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudHosting: boolean,
): Record<string, string> => {
  return ActionTriggerFunctionNames;
};

const ActionTriggerFunctionNames: Record<string, string> = {
  CLEAR_INTERVAL: "clearInterval",
  CLEAR_PLUGIN_ACTION: "action.clear",
  CLOSE_MODAL: "closeModal",
  COPY_TO_CLIPBOARD: "copyToClipboard",
  DOWNLOAD: "download",
  NAVIGATE_TO: "navigateTo",
  RESET_WIDGET_META_RECURSIVE_BY_NAME: "resetWidget",
  RUN_PLUGIN_ACTION: "action.run",
  SET_INTERVAL: "setInterval",
  SHOW_ALERT: "showAlert",
  SHOW_MODAL_BY_NAME: "showModal",
  STORE_VALUE: "storeValue",
  REMOVE_VALUE: "removeValue",
  CLEAR_STORE: "clearStore",
  GET_CURRENT_LOCATION: "getCurrentLocation",
  WATCH_CURRENT_LOCATION: "watchLocation",
  STOP_WATCHING_CURRENT_LOCATION: "stopWatch",
  POST_MESSAGE: "postWindowMessage",
  SET_TIMEOUT: "setTimeout",
  CLEAR_TIMEOUT: "clearTimeout",
};

export type ActionDescription =
  | TRunDescription
  | TClearDescription
  | TShowModalDescription
  | TCloseModalDescription
  | TClearDescription
  | TStoreValueDescription
  | TClearStoreDescription
  | TRemoveValueDescription
  | TDownloadDescription
  | TPostWindowMessageDescription
  | TNavigateToDescription
  | TShowAlertDescription
  | TResetWidgetDescription
  | TCopyToClipboardDescription
  | TGetGeoLocationDescription
  | TWatchGeoLocationDescription
  | TStopWatchGeoLocationDescription;
