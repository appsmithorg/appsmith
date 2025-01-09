import type { APP_MODE } from "entities/App";

export interface AuthUserState {
  username: string;
  email: string;
  id: string;
}

export interface UrlDataState {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  fullPath: string;
}

export type AppStoreState = Record<string, unknown>;

export interface AppDataState {
  mode?: APP_MODE;
  user: AuthUserState;
  URL: UrlDataState;
  store: AppStoreState;
  geolocation: {
    canBeRequested: boolean;
    currentPosition?: Partial<GeolocationPosition>;
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflows: Record<string, any>;
}
