import type { ERROR_CODES } from "@appsmith/constants/ApiConstants";

export interface ErrorPayload {
  id: string;
  message: string;
  type?: string;
  subType?: string;
  source?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
  hideToast?: boolean;
  show?: boolean;
  showDebugButton?: boolean;
}

export interface ErrorReduxState {
  safeCrash: boolean;
  safeCrashCode?: ERROR_CODES;
  currentError: {
    sourceAction?: string;
    message?: string;
    stackTrace?: string;
  };
}
