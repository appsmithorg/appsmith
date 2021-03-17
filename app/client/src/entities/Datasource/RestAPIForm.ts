import { Property } from "entities/Action";

export enum AuthType {
  NONE = "NONE",
  OAuth2 = "oAuth2",
}

export enum GrantType {
  ClientCredentials = "client_credentials",
  AuthorizationCode = "authorization_code",
}

export type Authentication = ClientCredentials | AuthorizationCode;
export interface ApiDatasourceForm {
  datasourceId: string;
  pluginId: string;
  organizationId: string;
  isValid: boolean;
  url: string;
  headers?: Property[];
  isSendSessionEnabled: boolean;
  sessionSignatureKey: string;
  authType: AuthType;
  authentication?: Authentication;
}

export interface Oauth2Common {
  authenticationType: AuthType.OAuth2;
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  headerPrefix: string;
  scopeString: string;
  isTokenHeader: boolean;
}

export interface ClientCredentials extends Oauth2Common {
  grantType: GrantType.ClientCredentials;
}

export interface AuthorizationCode extends Oauth2Common {
  grantType: GrantType.AuthorizationCode;
  authorizationUrl: string;
  customAuthenticationParameters: Property[];
  isAuthorizationHeader: boolean;
  isAuthorized: boolean;
}
