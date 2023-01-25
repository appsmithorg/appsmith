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
import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import {
  getGeoLocation,
  stopWatchGeoLocation,
  watchGeoLocation,
} from "./geolocationFns";

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
    path: "",
    qualifier: (entity: DataTreeEntity) => isAction(entity),
    fn: (entity: DataTreeEntity) => run.bind(entity),
  },
  {
    name: "clear",
    path: "data",
    qualifier: (entity: DataTreeEntity) => isAction(entity),
    fn: (entity: DataTreeEntity) => clear.bind(entity),
  },
  {
    name: "getGeoLocation",
    path: "appsmith.geolocation.getCurrentPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () => getGeoLocation,
  },
  {
    name: "watchGeoLocation",
    path: "appsmith.geolocation.watchPosition",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () => watchGeoLocation,
  },
  {
    name: "stopWatchGeoLocation",
    path: "appsmith.geolocation.clearWatch",
    qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
    fn: () => stopWatchGeoLocation,
  },
];
