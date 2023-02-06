import navigateTo, {
  TNavigateToActionType,
  TNavigateToDescription,
} from "./navigateTo";
import showAlert, {
  TShowAlertActionType,
  TShowAlertDescription,
} from "./showAlert";
import {
  closeModal,
  showModal,
  TCloseModalActionType,
  TCloseModalDescription,
  TShowModalActionType,
  TShowModalDescription,
} from "./modalFns";
import download, {
  TDownloadActionType,
  TDownloadDescription,
} from "./download";
import postWindowMessage, {
  TPostWindowMessageActionType,
  TPostWindowMessageDescription,
} from "./postWindowMessage";
import copyToClipboard, {
  TCopyToClipboardActionType,
  TCopyToClipboardDescription,
} from "./copyToClipboard";
import resetWidget, {
  TResetWidgetActionType,
  TResetWidgetDescription,
} from "./resetWidget";
import {
  clearStore,
  removeValue,
  storeValue,
  TClearStoreDescription,
  TRemoveValueDescription,
  TStoreValueDescription,
} from "./storeFns";
import run, {
  clear,
  TClearActionType,
  TClearDescription,
  TRunActionType,
  TRunDescription,
} from "./actionFns";
import {
  isAction,
  isAppsmithEntity,
} from "ce/workers/Evaluation/evaluationUtils";
import {
  DataTreeAction,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import {
  getGeoLocation,
  stopWatchGeoLocation,
  TGetGeoLocationActionType,
  TGetGeoLocationDescription,
  TStopWatchGeoLocationActionType,
  TStopWatchGeoLocationDescription,
  TWatchGeoLocationActionType,
  TWatchGeoLocationDescription,
  watchGeoLocation,
} from "./geolocationFns";
import { isAsyncGuard } from "./utils/fnGuard";

export const platformFns = [
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
    fn: (entity: DataTreeEntity) =>
      isAsyncGuard(run.bind(entity), `${(entity as DataTreeAction).name}.run`),
  },
  {
    name: "clear",
    qualifier: (entity: DataTreeEntity) => isAction(entity),
    fn: (entity: DataTreeEntity) =>
      isAsyncGuard(
        clear.bind(entity),
        `${(entity as DataTreeAction).name}.clear`,
      ),
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

export const ActionTriggerFunctionNames: Record<string, string> = {
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
