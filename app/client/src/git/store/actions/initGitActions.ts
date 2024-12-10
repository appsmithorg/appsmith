import type { FetchGitMetadataResponseData } from "git/requests/fetchGitMetadataRequest.types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export interface InitGitForEditorPayload {
  artifact: {
    id: string;
    baseId: string;
    gitApplicationMetadata?: Partial<FetchGitMetadataResponseData>;
  };
}

export const initGitForEditorAction =
  createSingleArtifactAction<InitGitForEditorPayload>((state) => {
    return state;
  });
