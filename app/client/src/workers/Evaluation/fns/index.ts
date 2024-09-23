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
import { isAppsmithEntity } from "ee/workers/Evaluation/evaluationUtils";
import type { ActionEntity } from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
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
import { getFnWithGuards, isAsyncGuard } from "./utils/fnGuard";
import { isRunNClearFnQualifierEntity } from "ee/workers/Evaluation/fns/utils/isRunNClearFnQualifierEntity";

export const getPlatformFunctions = () => {
  return platformFns;
};

export const getEntityFunctions = () => {
  return entityFns;
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

const entityFns = [
  {
    name: "run",
    qualifier: (entity: DataTreeEntity) => isRunNClearFnQualifierEntity(entity),
    fn: (entity: DataTreeEntity, entityName: string) => {
      const actionEntity = entity as ActionEntity;

      // @ts-expect-error: name is not defined on ActionEntity
      actionEntity.name = entityName;

      return getFnWithGuards(
        run.bind(actionEntity as ActionEntity),
        `${entityName}.run`,
        [isAsyncGuard],
      );
    },
  },
  {
    name: "clear",
    qualifier: (entity: DataTreeEntity) => isRunNClearFnQualifierEntity(entity),
    fn: (entity: DataTreeEntity, entityName: string) =>
      getFnWithGuards(
        clear.bind(entity as ActionEntity),
        `${entityName}.clear`,
        [isAsyncGuard],
      ),
  },
  {
    name: "getGeoLocation",
    path: "appsmith.geolocation.getCurrentPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      getFnWithGuards(
        getGeoLocation,
        "appsmith.geolocation.getCurrentPosition",
        [isAsyncGuard],
      ),
  },
  {
    name: "watchGeoLocation",
    path: "appsmith.geolocation.watchPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      getFnWithGuards(watchGeoLocation, "appsmith.geolocation.watchPosition", [
        isAsyncGuard,
      ]),
  },
  {
    name: "stopWatchGeoLocation",
    path: "appsmith.geolocation.clearWatch",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () =>
      getFnWithGuards(stopWatchGeoLocation, "appsmith.geolocation.clearWatch", [
        isAsyncGuard,
      ]),
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

export const getActionTriggerFunctionNames = (): Record<string, string> => {
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
