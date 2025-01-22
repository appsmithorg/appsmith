import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  GitArtifactBasePayload,
  GitArtifactRootReduxState,
} from "../types";
import { gitArtifactInitialState } from "../helpers/initialState";

// ! This might be removed later

export const mountAction = (
  state: GitArtifactRootReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactDef } = action.payload;
  const { artifactType, baseArtifactId } = artifactDef;

  state[artifactType] ??= {};
  state[artifactType][baseArtifactId] ??= gitArtifactInitialState;

  return state;
};

export const unmountAction = (
  state: GitArtifactRootReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactDef } = action.payload;
  const { artifactType, baseArtifactId } = artifactDef;

  delete state?.[artifactType]?.[baseArtifactId];

  return state;
};
