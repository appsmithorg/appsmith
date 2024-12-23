import { createArtifactAction } from "../helpers/createArtifactAction";
import type { ApplicationPayload } from "entities/Application";

export interface InitGitForEditorPayload {
  artifact: ApplicationPayload | null;
}

export const initGitForEditorAction =
  createArtifactAction<InitGitForEditorPayload>((state) => {
    return state;
  });
