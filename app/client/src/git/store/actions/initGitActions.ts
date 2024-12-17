import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { ApplicationPayload } from "entities/Application";

export interface InitGitForEditorPayload {
  artifact: ApplicationPayload | null;
}

export const initGitForEditorAction =
  createSingleArtifactAction<InitGitForEditorPayload>((state) => {
    return state;
  });
