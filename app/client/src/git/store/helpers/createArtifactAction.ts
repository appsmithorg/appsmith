import type {
  GitArtifactBasePayload,
  GitArtifactPayloadAction,
  GitArtifactReduxState,
  GitArtifactRootReduxState,
} from "../types";
import { gitArtifactInitialState } from "./initialState";

type ArtifactStateCb<T> = (
  artifactState: GitArtifactReduxState,
  action: GitArtifactPayloadAction<T>,
) => GitArtifactReduxState;

export const createArtifactAction = <T = GitArtifactBasePayload>(
  artifactStateCb: ArtifactStateCb<T>,
) => {
  return (
    state: GitArtifactRootReduxState,
    action: GitArtifactPayloadAction<T>,
  ) => {
    const { artifactType, baseArtifactId } = action.payload.artifactDef;

    state[artifactType] ??= {};
    state[artifactType][baseArtifactId] ??= gitArtifactInitialState;

    const artifactState = state[artifactType][baseArtifactId];

    state[artifactType][baseArtifactId] = artifactStateCb(
      artifactState,
      action,
    );

    return state;
  };
};
