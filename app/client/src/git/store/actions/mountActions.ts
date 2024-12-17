import type { PayloadAction } from "@reduxjs/toolkit";
import type { GitArtifactBasePayload, GitArtifactReduxState } from "../types";
import { gitSingleArtifactInitialState } from "../helpers/gitSingleArtifactInitialState";

// ! This might be removed later

export const mountAction = (
  state: GitArtifactReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactDef } = action.payload;
  const { artifactType, baseArtifactId } = artifactDef;

  state[artifactType] ??= {};
  state[artifactType][baseArtifactId] ??= gitSingleArtifactInitialState;

  return state;
};

export const unmountAction = (
  state: GitArtifactReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactDef } = action.payload;
  const { artifactType, baseArtifactId } = artifactDef;

  delete state?.[artifactType]?.[baseArtifactId];

  return state;
};
