import type { AppsmithLocationState } from "utils/history";

export interface NavigateToAnotherPagePayload {
  pageURL: string;
  query?: string;
  state?: AppsmithLocationState;
}
