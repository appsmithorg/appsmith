import { createArtifactAction } from "../helpers/createArtifactAction";
import type { ApplicationPayload } from "entities/Application";

export interface InitGitForEditorPayload {
  artifact: ApplicationPayload | null;
}

export const initGitForEditorAction =
  createArtifactAction<InitGitForEditorPayload>((state) => {
    state.ui.initializing = true;
    state.ui.initialized = false;

    return state;
  });

export const initGitForEditorSuccessAction = createArtifactAction((state) => {
  state.ui.initializing = false;
  state.ui.initialized = true;

  return state;
});
