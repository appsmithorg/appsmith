import type { APP_MODE } from "../../entities/App";

export type AuthUserState = {
  username: string;
  email: string;
  id: string;
};

export type UrlDataState = {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  fullPath: string;
};

export type AppStoreState = Record<string, unknown>;

export type AppDataState = {
  mode?: APP_MODE;
  user: AuthUserState;
  URL: UrlDataState;
  store: AppStoreState;
  geolocation: {
    canBeRequested: boolean;
    currentPosition?: Partial<GeolocationPosition>;
  };
};
