// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export enum CameraModeTypes {
  CAMERA = "CAMERA",
  VIDEO = "VIDEO",
}

export type CameraMode = keyof typeof CameraModeTypes;

export enum MediaCaptureStatusTypes {
  IMAGE_DEFAULT = "IMAGE_DEFAULT",
  IMAGE_CAPTURED = "IMAGE_CAPTURED",
  IMAGE_SAVED = "IMAGE_SAVED",
  VIDEO_DEFAULT = "VIDEO_DEFAULT",
  VIDEO_RECORDING = "VIDEO_RECORDING",
  VIDEO_CAPTURED = "VIDEO_CAPTURED",
  VIDEO_PLAYING = "VIDEO_PLAYING",
  VIDEO_PAUSED = "VIDEO_PAUSED",
  VIDEO_SAVED = "VIDEO_SAVED",
  VIDEO_PLAYING_AFTER_SAVE = "VIDEO_PLAYING_AFTER_SAVE",
  VIDEO_PAUSED_AFTER_SAVE = "VIDEO_PAUSED_AFTER_SAVE",
}

export type MediaCaptureStatus = keyof typeof MediaCaptureStatusTypes;

export enum MediaCaptureActionTypes {
  IMAGE_CAPTURE = "IMAGE_CAPTURE",
  IMAGE_SAVE = "IMAGE_SAVE",
  IMAGE_DISCARD = "IMAGE_DISCARD",
  IMAGE_REFRESH = "IMAGE_REFRESH",
  RECORDING_START = "RECORDING_START",
  RECORDING_STOP = "RECORDING_STOP",
  RECORDING_DISCARD = "RECORDING_DISCARD",
  RECORDING_SAVE = "RECORDING_SAVE",
  VIDEO_PLAY = "VIDEO_PLAY",
  VIDEO_PAUSE = "VIDEO_PAUSE",
  VIDEO_PLAY_AFTER_SAVE = "VIDEO_PLAY_AFTER_SAVE",
  VIDEO_PAUSE_AFTER_SAVE = "VIDEO_PAUSE_AFTER_SAVE",
  VIDEO_REFRESH = "VIDEO_REFRESH",
}

export type MediaCaptureAction = keyof typeof MediaCaptureActionTypes;

export enum DeviceTypes {
  MICROPHONE = "MICROPHONE",
  CAMERA = "CAMERA",
}
export type DeviceType = keyof typeof DeviceTypes;
