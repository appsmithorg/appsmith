import { Property } from "entities/Action";

export enum AuthType {
  NONE = "NONE",
  OAuth2 = "oAuth2",
  basic = "basic",
  apiKey = "apiKey",
  bearerToken = "bearerToken",
}

export enum SSLType {
  DEFAULT = "DEFAULT",
  SELF_SIGNED_CERTIFICATE = "SELF_SIGNED_CERTIFICATE",
}

export enum ApiKeyAuthType {
  QueryParams = "queryParams",
  Header = "header",
}

export enum GrantType {
  ClientCredentials = "client_credentials",
  AuthorizationCode = "authorization_code",
}

export type Authentication =
  | ClientCredentials
  | AuthorizationCode
  | Basic
  | ApiKey
  | BearerToken;

export interface Connection {
  ssl: SSL;
}

export interface SSL {
  authType: SSLType;
  certificateFile: Certificate;
}

export interface Certificate {
  name: string;
  base64Content: string | ArrayBuffer | null;
}

export interface ApiDatasourceForm {
  datasourceId: string;
  pluginId: string;
  organizationId: string;
  isValid: boolean;
  url: string;
  headers?: Property[];
  queryParameters?: Property[];
  isSendSessionEnabled: boolean;
  sessionSignatureKey: string;
  authType: AuthType;
  authentication?: Authentication;
  connection?: Connection;
}

export interface Oauth2Common {
  authenticationType: AuthType.OAuth2;
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  headerPrefix: string;
  scopeString: string;
  isTokenHeader: boolean;
  audience: string;
  resource: string;
  sendScopeWithRefreshToken: string;
  refreshTokenClientCredentialsLocation: string;
}

export interface ClientCredentials extends Oauth2Common {
  grantType: GrantType.ClientCredentials;
  customTokenParameters: Property[];
}

export interface AuthorizationCode extends Oauth2Common {
  grantType: GrantType.AuthorizationCode;
  authorizationUrl: string;
  customAuthenticationParameters: Property[];
  isAuthorizationHeader: boolean;
  isAuthorized: boolean;
}

export interface Basic {
  authenticationType: AuthType.basic;
  username: string;
  password: string;
}

export interface ApiKey {
  authenticationType: AuthType.apiKey;
  label: string;
  headerPrefix: string;
  value: string;
  addTo: string;
}

export interface BearerToken {
  authenticationType: AuthType.bearerToken;
  bearerToken: string;
}
