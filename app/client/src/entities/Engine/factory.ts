import { APP_MODE } from "entities/App";
import AppEngine from ".";
import AppEditorEngine from "./AppEditorEngine";
import AppViewerEngine from "./AppViewerEngine";

const registeredAppEngines = {
  [APP_MODE.EDIT]: AppEditorEngine,
  [APP_MODE.PUBLISHED]: AppViewerEngine,
};

export default class AppEngineFactory {
  static create(
    type: keyof typeof registeredAppEngines,
    mode: APP_MODE,
  ): AppEngine {
    return new registeredAppEngines[type](mode);
  }
}
