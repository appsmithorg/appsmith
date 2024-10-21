import type {
  GitArtifactPayloadAction,
  GitArtifactReduxState,
  GitSingleArtifactReduxState,
} from "../../types";

type SingleArtifactStateCb<T> = (
  singleArtifactState: GitSingleArtifactReduxState,
  action: GitArtifactPayloadAction<T>,
) => GitSingleArtifactReduxState;

export const gitSingleArtifactInitialState: GitSingleArtifactReduxState = {
  metadata: {
    value: null,
    loading: false,
    error: null,
  },
  connect: {
    loading: false,
    error: null,
  },
  branches: {
    value: null,
    loading: false,
    error: null,
  },
  status: {
    value: null,
    loading: false,
    error: null,
  },
  commit: {
    value: null,
    loading: false,
    error: null,
  },
  pull: {
    loading: false,
    error: null,
  },
};

export const createSingleArtifactAction = <T>(
  singleArtifactStateCb: SingleArtifactStateCb<T>,
) => {
  return (
    state: GitArtifactReduxState,
    action: GitArtifactPayloadAction<T>,
  ) => {
    const { artifactType, baseArtifactId } = action.payload;

    if (!state[artifactType]) {
      state[artifactType] = {};
    }

    if (!state[artifactType][baseArtifactId]) {
      state[artifactType][baseArtifactId] = gitSingleArtifactInitialState;
    }

    const singleArtifactState = state[artifactType][baseArtifactId];

    state[artifactType][baseArtifactId] = singleArtifactStateCb(
      singleArtifactState,
      action,
    );

    return state;
  };
};
