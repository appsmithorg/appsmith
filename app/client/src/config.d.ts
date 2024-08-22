import type { AppState } from "ee/reducers";
import "react-redux";

declare module "react-redux" {
  // We want the DefaultRootState interface to be the AppState interface
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultRootState extends AppState {}
}
