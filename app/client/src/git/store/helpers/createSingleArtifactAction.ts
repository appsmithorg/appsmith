import type {
  GitArtifactBasePayload,
  GitArtifactPayloadAction,
  GitArtifactReduxState,
  GitSingleArtifactReduxState,
} from "../types";
import { gitSingleArtifactInitialState } from "./gitSingleArtifactInitialState";

type SingleArtifactStateCb<T> = (
  singleArtifactState: GitSingleArtifactReduxState,
  action: GitArtifactPayloadAction<T>,
) => GitSingleArtifactReduxState;

export const createSingleArtifactAction = <T = GitArtifactBasePayload>(
  singleArtifactStateCb: SingleArtifactStateCb<T>,
) => {
  return (
    state: GitArtifactReduxState,
    action: GitArtifactPayloadAction<T>,
  ) => {
    const { artifactType, baseArtifactId } = action.payload;

    state[artifactType] ??= {};
    state[artifactType][baseArtifactId] ??= gitSingleArtifactInitialState;

    const singleArtifactState = state[artifactType][baseArtifactId];

    state[artifactType][baseArtifactId] = singleArtifactStateCb(
      singleArtifactState,
      action,
    );

    return state;
  };
};
