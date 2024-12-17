import type { FetchMetadataResponseData } from "git/requests/fetchMetadataRequest.types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export interface InitGitForEditorPayload {
  artifact: {
    id: string;
    baseId: string;
    gitApplicationMetadata?: Partial<FetchMetadataResponseData>;
  };
}

export const initGitForEditorAction =
  createSingleArtifactAction<InitGitForEditorPayload>((state) => {
    return state;
  });
