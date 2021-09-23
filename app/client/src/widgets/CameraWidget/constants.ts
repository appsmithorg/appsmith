// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export enum CameraModeTypes {
  CAMERA = "CAMERA",
  VIDEO = "VIDEO",
}

export type CameraMode = keyof typeof CameraModeTypes;
