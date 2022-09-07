import { Property } from "entities/Action";
import { Datasource } from "entities/Datasource";
import {
  ApiDatasourceForm,
  Authentication,
  AuthorizationCode,
  AuthType,
  ClientCredentials,
  GrantType,
  Oauth2Common,
  Basic,
  ApiKey,
  BearerToken,
  SSLType,
} from "entities/Datasource/RestAPIForm";
import _ from "lodash";

export const datasourceToFormValues = (
  datasource: Datasource,
): ApiDatasourceForm => {
  const authType = _.get(
    datasource,
    "datasourceConfiguration.authentication.authenticationType",
    AuthType.NONE,
  );
  const connection = _.get(datasource, "datasourceConfiguration.connection", {
    ssl: {
      authType: SSLType.DEFAULT,
    },
  });
  const authentication = datasourceToFormAuthentication(authType, datasource);
  const isSendSessionEnabled =
    _.get(datasource, "datasourceConfiguration.properties[0].value", "N") ===
    "Y";
  const sessionSignatureKey = isSendSessionEnabled
    ? _.get(datasource, "datasourceConfiguration.properties[1].value")
    : "";
  return {
    datasourceId: datasource.id,
    workspaceId: datasource.workspaceId,
    pluginId: datasource.pluginId,
    isValid: datasource.isValid,
    url: datasource.datasourceConfiguration?.url,
    headers: cleanupProperties(datasource.datasourceConfiguration?.headers),
    queryParameters: cleanupProperties(
      datasource.datasourceConfiguration?.queryParameters,
    ),
    isSendSessionEnabled: isSendSessionEnabled,
    sessionSignatureKey: sessionSignatureKey,
    authType: authType,
    authentication: authentication,
    connection: connection,
  };
};

export const formValuesToDatasource = (
  datasource: Datasource,
  form: ApiDatasourceForm,
): Datasource => {
  const authentication = formToDatasourceAuthentication(
    form.authType,
    form.authentication,
  );

  return {
    ...datasource,
    datasourceConfiguration: {
      url: form.url,
      headers: cleanupProperties(form.headers),
      queryParameters: cleanupProperties(form.queryParameters),
      properties: [
        {
          key: "isSendSessionEnabled",
          value: form.isSendSessionEnabled ? "Y" : "N",
        },
        { key: "sessionSignatureKey", value: form.sessionSignatureKey },
      ],
      authentication: authentication,
      connection: form.connection,
    },
  } as Datasource;
};

const formToDatasourceAuthentication = (
  authType: AuthType,
  authentication: Authentication | undefined,
): Authentication | null => {
  if (authType === AuthType.NONE || !authentication) return null;
  if (
    isClientCredentials(authType, authentication) ||
    isAuthorizationCode(authType, authentication)
  ) {
    const oAuth2Common: Oauth2Common = {
      authenticationType: AuthType.OAuth2,
      accessTokenUrl: authentication.accessTokenUrl,
      clientId: authentication.clientId,
      headerPrefix: authentication.headerPrefix,
      scopeString: authentication.scopeString,
      clientSecret: authentication.clientSecret,
      isAuthorizationHeader: authentication.isAuthorizationHeader,
      isTokenHeader: authentication.isTokenHeader,
      audience: authentication.audience,
      resource: authentication.resource,
      sendScopeWithRefreshToken: authentication.sendScopeWithRefreshToken,
      refreshTokenClientCredentialsLocation:
        authentication.refreshTokenClientCredentialsLocation,
      useSelfSignedCert: authentication.useSelfSignedCert,
    };
    if (isClientCredentials(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: GrantType.ClientCredentials,
        customTokenParameters: cleanupProperties(
          authentication.customTokenParameters,
        ),
      };
    }
    if (isAuthorizationCode(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: GrantType.AuthorizationCode,
        authorizationUrl: authentication.authorizationUrl,
        isAuthorized: !!authentication.isAuthorized,
        customAuthenticationParameters: cleanupProperties(
          authentication.customAuthenticationParameters,
        ),
      };
    }
  }
  if (authType === AuthType.basic) {
    if ("username" in authentication) {
      const basic: Basic = {
        authenticationType: AuthType.basic,
        username: authentication.username,
        password: authentication.password,
      };
      return basic;
    }
  }
  if (authType === AuthType.apiKey) {
    if ("label" in authentication) {
      const apiKey: ApiKey = {
        authenticationType: AuthType.apiKey,
        label: authentication.label,
        value: authentication.value,
        headerPrefix: authentication.headerPrefix,
        addTo: authentication.addTo,
      };
      return apiKey;
    }
  }
  if (authType === AuthType.bearerToken) {
    if ("bearerToken" in authentication) {
      const bearerToken: BearerToken = {
        authenticationType: AuthType.bearerToken,
        bearerToken: authentication.bearerToken,
      };
      return bearerToken;
    }
  }
  return null;
};

const datasourceToFormAuthentication = (
  authType: AuthType,
  datasource: Datasource,
): Authentication | undefined => {
  if (
    !datasource ||
    !datasource.datasourceConfiguration ||
    !datasource.datasourceConfiguration.authentication
  ) {
    return;
  }

  const authentication = datasource.datasourceConfiguration.authentication;
  if (
    isClientCredentials(authType, authentication) ||
    isAuthorizationCode(authType, authentication)
  ) {
    const oAuth2Common: Oauth2Common = {
      authenticationType: AuthType.OAuth2,
      accessTokenUrl: authentication.accessTokenUrl || "",
      clientId: authentication.clientId || "",
      headerPrefix: authentication.headerPrefix || "",
      scopeString: authentication.scopeString || "",
      clientSecret: authentication.clientSecret,
      isTokenHeader: !!authentication.isTokenHeader,
      isAuthorizationHeader: !!authentication.isAuthorizationHeader,
      audience: authentication.audience || "",
      resource: authentication.resource || "",
      sendScopeWithRefreshToken: authentication.sendScopeWithRefreshToken || "",
      refreshTokenClientCredentialsLocation:
        authentication.refreshTokenClientCredentialsLocation || "BODY",
    };
    if (isClientCredentials(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: GrantType.ClientCredentials,
        customTokenParameters: cleanupProperties(
          authentication.customTokenParameters,
        ),
      };
    }
    if (isAuthorizationCode(authType, authentication)) {
      return {
        ...oAuth2Common,
        grantType: GrantType.AuthorizationCode,
        authorizationUrl: authentication.authorizationUrl || "",
        customAuthenticationParameters: cleanupProperties(
          authentication.customAuthenticationParameters,
        ),
        isAuthorized: !!authentication.isAuthorized,
        isAuthorizationHeader:
          typeof authentication.isAuthorizationHeader === "undefined"
            ? true
            : !!authentication.isAuthorizationHeader,
      };
    }
  }
  if (authType === AuthType.basic) {
    const basic: Basic = {
      authenticationType: AuthType.basic,
      username: authentication.username || "",
      password: authentication.password || "",
    };
    return basic;
  }
  if (authType === AuthType.apiKey) {
    const apiKey: ApiKey = {
      authenticationType: AuthType.apiKey,
      label: authentication.label || "",
      value: authentication.value || "",
      headerPrefix: authentication.headerPrefix || "",
      addTo: authentication.addTo || "",
    };
    return apiKey;
  }
  if (authType === AuthType.bearerToken) {
    const bearerToken: BearerToken = {
      authenticationType: AuthType.bearerToken,
      bearerToken: authentication.bearerToken || "",
    };
    return bearerToken;
  }
};

const isClientCredentials = (
  authType: AuthType,
  val: any,
): val is ClientCredentials => {
  if (authType !== AuthType.OAuth2) return false;
  // If there's no authentication object at all and it is oauth2, it is client credentials by default
  if (!val) return true;
  return _.get(val, "grantType") === GrantType.ClientCredentials;
};

const isAuthorizationCode = (
  authType: AuthType,
  val: any,
): val is AuthorizationCode => {
  if (authType !== AuthType.OAuth2) return false;
  return _.get(val, "grantType") === GrantType.AuthorizationCode;
};

const cleanupProperties = (values: Property[] | undefined): Property[] => {
  if (!Array.isArray(values)) return [];

  const newValues: Property[] = [];
  values.forEach((object: Property) => {
    const isEmpty = Object.values(object).every((x) => x === "");
    if (!isEmpty) {
      newValues.push(object);
    }
  });
  return newValues;
};
