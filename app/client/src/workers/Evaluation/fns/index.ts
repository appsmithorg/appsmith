import navigateTo from "./navigateTo";
import showAlert from "./showAlert";
import { closeModal, showModal } from "./modalFns";
import download from "./download";
import postWindowMessage from "./postWindowMessage";
import copyToClipboard from "./copyToClipboard";
import resetWidget from "./resetWidget";
import { clearStore, removeValue, storeValue } from "./storeFns";
import run, { clear } from "./actionFns";
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
