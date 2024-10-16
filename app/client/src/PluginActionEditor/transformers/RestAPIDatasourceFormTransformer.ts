import { isEnvironmentValid } from "ee/utils/Environments";
import type { Property } from "entities/Action";
import type { Datasource, DatasourceStorage } from "entities/Datasource";
import type {
  ApiDatasourceForm,
  Authentication,
  AuthorizationCode,
  ClientCredentials,
  Oauth2Common,
  Basic,
  ApiKey,
  BearerToken,
  SSL,
} from "entities/Datasource/RestAPIForm";
import { AuthType, GrantType, SSLType } from "entities/Datasource/RestAPIForm";
import { get, set } from "lodash";

export const datasourceToFormValues = (
  datasource: Datasource,
  currentEnvironment: string,
): ApiDatasourceForm => {
  const authType = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.authenticationType`,
    AuthType.NONE,
  ) as AuthType;
  const connection = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.connection`,
    {
      ssl: {
        authType: SSLType.DEFAULT,
        authTypeControl: false,
      } as SSL,
    },
  );

  // set value of authTypeControl in connection if it is not present
  // authTypeControl is true if authType is SELF_SIGNED_CERTIFICATE else false
  if (!connection.ssl.authTypeControl) {
    set(
      connection,
      "ssl.authTypeControl",
      connection.ssl.authType === SSLType.SELF_SIGNED_CERTIFICATE,
    );
  }

  const authentication = datasourceToFormAuthentication(
    authType,
    datasource,
    currentEnvironment,
  );
  const isSendSessionEnabled =
    get(
      datasource,
      `datasourceStorages.${currentEnvironment}.datasourceConfiguration.properties[0].value`,
      "N",
    ) === "Y";
  const sessionSignatureKey = isSendSessionEnabled
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      get(
        datasource,
        `datasourceStorages.${currentEnvironment}.datasourceConfiguration.properties[1].value`,
      )!
    : "";

  return {
    datasourceId: datasource.id,
    workspaceId: datasource.workspaceId,
    pluginId: datasource.pluginId,
    isValid: isEnvironmentValid(datasource, currentEnvironment),
    url: datasource.datasourceStorages[currentEnvironment]
      ?.datasourceConfiguration?.url,
    headers: cleanupProperties(
      datasource.datasourceStorages[currentEnvironment]?.datasourceConfiguration
        ?.headers,
    ),
    queryParameters: cleanupProperties(
      datasource.datasourceStorages[currentEnvironment]?.datasourceConfiguration
        ?.queryParameters,
    ),
    isSendSessionEnabled: isSendSessionEnabled,
    sessionSignatureKey: sessionSignatureKey,
    authType: authType,
    authentication: authentication,
    connection: connection,
  } as ApiDatasourceForm;
};

export const formValuesToDatasource = (
  datasource: Datasource,
  form: ApiDatasourceForm,
  currentEnvironment: string,
): Datasource => {
  const authentication = formToDatasourceAuthentication(
    form.authType,
    form.authentication,
  );
  const dsStorages = datasource.datasourceStorages;
  let dsStorage: DatasourceStorage;

  if (dsStorages.hasOwnProperty(currentEnvironment)) {
    dsStorage = dsStorages[currentEnvironment];
  } else {
    dsStorage = {
      environmentId: currentEnvironment,
      datasourceConfiguration: {
        url: "",
      },
      isValid: false,
      datasourceId: datasource.id,
    };
  }

  if (!dsStorage.hasOwnProperty("environmentId")) {
    dsStorage.environmentId = currentEnvironment;
  }

  const connection = form.connection;

  if (connection) {
    const authTypeControl = connection.ssl.authTypeControl;

    set(
      connection,
      "ssl.authType",
      authTypeControl ? SSLType.SELF_SIGNED_CERTIFICATE : SSLType.DEFAULT,
    );
  }

  const conf = {
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
  };

  set(dsStorage, "datasourceConfiguration", conf);
  set(dsStorages, currentEnvironment, dsStorage);

  return datasource;
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
        expiresIn: authentication.expiresIn,
      };
    }
  }

  if (authType === AuthType.basic) {
    if ("username" in authentication) {
      const basic: Basic = {
        authenticationType: AuthType.basic,
        username: authentication.username,
        password: authentication.password,
        secretExists: authentication.secretExists,
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
  currentEnvironment: string,
): Authentication | undefined => {
  if (
    !datasource ||
    !datasource.datasourceStorages[currentEnvironment]
      ?.datasourceConfiguration ||
    !datasource.datasourceStorages[currentEnvironment]?.datasourceConfiguration
      .authentication
  ) {
    return;
  }

  const authentication =
    datasource.datasourceStorages[currentEnvironment].datasourceConfiguration
      .authentication || {};

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
      sendScopeWithRefreshToken:
        authentication.sendScopeWithRefreshToken || false,
      refreshTokenClientCredentialsLocation:
        authentication.refreshTokenClientCredentialsLocation || "BODY",
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
        authorizationUrl: authentication.authorizationUrl || "",
        customAuthenticationParameters: cleanupProperties(
          authentication.customAuthenticationParameters,
        ),
        isAuthorized: !!authentication.isAuthorized,
        isAuthorizationHeader:
          typeof authentication.isAuthorizationHeader === "undefined"
            ? true
            : !!authentication.isAuthorizationHeader,
        expiresIn: authentication.expiresIn,
      };
    }
  }

  if (authType === AuthType.basic) {
    const basic: Basic = {
      authenticationType: AuthType.basic,
      username: authentication.username || "",
      password: authentication.password || "",
      secretExists: authentication.secretExists,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val: any,
): val is ClientCredentials => {
  if (authType !== AuthType.OAuth2) return false;

  // If there's no authentication object at all and it is oauth2, it is client credentials by default
  if (!val) return true;

  return get(val, "grantType") === GrantType.ClientCredentials;
};

const isAuthorizationCode = (
  authType: AuthType,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  val: any,
): val is AuthorizationCode => {
  if (authType !== AuthType.OAuth2) return false;

  return get(val, "grantType") === GrantType.AuthorizationCode;
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
