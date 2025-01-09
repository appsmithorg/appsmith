// Using built-in Error type instead of importing from AppsmithConsole
type Error = globalThis.Error;

export enum AlertType {
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export enum CONVERSION_STATES {
  START = "START",
  CONFIRM_CONVERSION = "CONFIRM_CONVERSION",
  SNAPSHOT_SPINNER = "SNAPSHOT_SPINNER",
  CONVERSION_SPINNER = "CONVERSION_SPINNER",
  COMPLETED_SUCCESS = "COMPLETED_SUCCESS",
  COMPLETED_WARNING = "COMPLETED_WARNING",
  COMPLETED_ERROR = "COMPLETED_ERROR",
  SNAPSHOT_START = "SNAPSHOT_START",
  DISCARD_SNAPSHOT = "DISCARD_SNAPSHOT",
  RESTORING_SNAPSHOT_SPINNER = "RESTORING_SNAPSHOT_SPINNER",
}

export interface SnapshotDetails {
  updatedTime: string;
}

export interface layoutConversionReduxState {
  snapshotDetails: SnapshotDetails | undefined;
  conversionError: Error | undefined;
  conversionState: CONVERSION_STATES;
  isConverting: boolean;
}
