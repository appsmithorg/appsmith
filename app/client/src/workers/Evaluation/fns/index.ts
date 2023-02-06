import navigateTo, { TNavigateToActionType } from "./navigateTo";
import showAlert, { TShowAlertActionType } from "./showAlert";
import {
  closeModal,
  showModal,
  TCloseModalActionType,
  TShowModalActionType,
} from "./modalFns";
import download, { TDownloadActionType } from "./download";
import postWindowMessage, {
  TPostWindowMessageActionType,
} from "./postWindowMessage";
import copyToClipboard, { TCopyToClipboardActionType } from "./copyToClipboard";
import resetWidget, { TResetWidgetActionType } from "./resetWidget";
import { clearStore, removeValue, storeValue } from "./storeFns";
import run, { clear, TClearActionType, TRunActionType } from "./actionFns";
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
  TStopWatchGeoLocationActionType,
  TWatchGeoLocationActionType,
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
