import type { PayloadAction } from "@reduxjs/toolkit";
import type { GitArtifactBasePayload, GitArtifactReduxState } from "../types";
import { gitSingleArtifactInitialState } from "./helpers/singleArtifactInitialState";

// ! This might be removed later

export const mountAction = (
  state: GitArtifactReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactType, baseArtifactId } = action.payload;

  state[artifactType] ??= {};
  state[artifactType][baseArtifactId] ??= gitSingleArtifactInitialState;

  return state;
};

export const unmountAction = (
  state: GitArtifactReduxState,
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  const { artifactType, baseArtifactId } = action.payload;

  delete state?.[artifactType]?.[baseArtifactId];

  return state;
};
