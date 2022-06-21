import { APP_MODE } from "entities/App";
import AppEngine from ".";
import AppEditorEngine from "./AppEditorEngine";
import AppViewerEngine from "./AppViewerEngine";

export default class AppEngineFactory {
  static create(mode: APP_MODE): AppEngine {
    if (mode === APP_MODE.EDIT) return new AppEditorEngine(mode);
    return new AppViewerEngine(mode);
  }
}
