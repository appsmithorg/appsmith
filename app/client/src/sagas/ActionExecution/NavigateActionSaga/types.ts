import type { LocationState } from "history";

export interface NavigateToAnotherPagePayload {
  pageURL: string;
  query: string;
  state?: LocationState;
}
