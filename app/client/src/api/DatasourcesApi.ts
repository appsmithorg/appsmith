import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "ee/constants/ApiConstants";
import API from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { AxiosPromise } from "axios";

import type { Datasource, DatasourceStorage } from "entities/Datasource";
export interface CreateDatasourceConfig {
  name: string;
  pluginId: string;
  type?: string;
  // key in the map representation of environment id of type string
  datasourceStorages: Record<string, DatasourceStorage>;
  //Passed for logging purposes.
  appName?: string;
}

// type executeQueryData = Array<{ key?: string; value?: string }>;
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type executeQueryData = Record<string, any>;

interface executeDatasourceQueryRequest {
  datasourceId: string;
  data?: executeQueryData;
}

class DatasourcesApi extends API {
  static url = "v1/datasources";

  static async fetchDatasources(
    workspaceId: string,
  ): Promise<AxiosPromise<ApiResponse<Datasource[]>>> {
    return API.get(DatasourcesApi.url + `?workspaceId=${workspaceId}`);
  }

  static async createDatasource(
    datasourceConfig: Partial<Datasource>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // This here abomination is to remove several fields that are not accepted by the server.
    for (const [name, storage] of Object.entries(
      datasourceConfig.datasourceStorages || {},
    )) {
      datasourceConfig = {
        ...datasourceConfig,
        isValid: undefined,
        datasourceStorages: {
          ...datasourceConfig.datasourceStorages,
          [name]: {
            ...storage,
            isValid: undefined,
            toastMessage: undefined,
            datasourceConfiguration: {
              ...storage.datasourceConfiguration,
              isValid: undefined,
              connection: storage.datasourceConfiguration.connection && {
                ...storage.datasourceConfiguration.connection,
                ssl: {
                  ...storage.datasourceConfiguration.connection.ssl,
                  authTypeControl: undefined,
                  certificateType: undefined,
                },
              },
            },
          },
        },
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }

    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  // Need for when we add strict type checking back on server
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static cleanAuthenticationObject(authentication: any): any {
    if (!authentication) {
      return undefined;
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clean: any = {
      authenticationType: authentication.authenticationType ?? "dbAuth",
    };

    switch (clean.authenticationType) {
      case "dbAuth":
        clean.authType = authentication.authType;
        clean.username = authentication.username;
        clean.password = authentication.password;
        clean.databaseName = authentication.databaseName;
        break;
      case "oAuth2":
        clean.grantType = authentication.grantType;
        clean.isTokenHeader = authentication.isTokenHeader;
        clean.isAuthorizationHeader = authentication.isAuthorizationHeader;
        clean.clientId = authentication.clientId;
        clean.clientSecret = authentication.clientSecret;
        clean.authorizationUrl = authentication.authorizationUrl;
        clean.expiresIn = authentication.expiresIn;
        clean.accessTokenUrl = authentication.accessTokenUrl;
        clean.scopeString = authentication.scopeString;
        clean.scope = authentication.scope;
        clean.sendScopeWithRefreshToken =
          authentication.sendScopeWithRefreshToken;
        clean.refreshTokenClientCredentialsLocation =
          authentication.refreshTokenClientCredentialsLocation;
        clean.headerPrefix = authentication.headerPrefix;
        clean.customTokenParameters = authentication.customTokenParameters;
        clean.audience = authentication.audience;
        clean.resource = authentication.resource;
        clean.useSelfSignedCert = authentication.useSelfSignedCert;
        clean.authenticationStatus = authentication.authenticationStatus;
        break;
      case "basic":
        clean.username = authentication.username;
        clean.password = authentication.password;
        break;
      case "apiKey":
        clean.addTo = authentication.addTo;
        clean.label = authentication.label;
        clean.headerPrefix = authentication.headerPrefix;
        clean.value = authentication.value;
        break;
      case "bearerToken":
        clean.bearerToken = authentication.bearerToken;
        break;
      case "snowflakeKeyPairAuth":
        clean.username = authentication.username;
        clean.privateKey = authentication.privateKey;
        clean.passphrase = authentication.passphrase;
    }

    return clean;
  }

  // Api to test current environment datasource
  static async testDatasource(
    datasourceConfig: Partial<DatasourceStorage>,
    pluginId: string,
    workspaceId: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const payload = {
      ...datasourceConfig,
      pluginId,
      workspaceId,
      isValid: undefined,
      toastMessage: undefined,
      datasourceConfiguration: datasourceConfig.datasourceConfiguration && {
        ...datasourceConfig.datasourceConfiguration,
        connection: datasourceConfig.datasourceConfiguration.connection && {
          ...datasourceConfig.datasourceConfiguration.connection,
          ssl: {
            ...datasourceConfig.datasourceConfiguration.connection.ssl,
            certificateType: undefined,
          },
        },
      },
    };

    return API.post(`${DatasourcesApi.url}/test`, payload, undefined, {
      timeout: DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS,
    });
  }

  // Api to update datasource name.
  static async updateDatasource(
    datasourceConfig: Partial<Datasource>,
    id: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return API.put(DatasourcesApi.url + `/${id}`, datasourceConfig);
  }

  // Api to update specific datasource storage/environment configuration
  static async updateDatasourceStorage(
    datasourceStorage: Partial<DatasourceStorage>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const payload = {
      ...datasourceStorage,
      isValid: undefined,
      toastMessage: undefined,
      datasourceConfiguration: datasourceStorage.datasourceConfiguration && {
        ...datasourceStorage.datasourceConfiguration,
        connection: datasourceStorage.datasourceConfiguration.connection && {
          ...datasourceStorage.datasourceConfiguration.connection,
          ssl: {
            ...datasourceStorage.datasourceConfiguration.connection.ssl,
            authTypeControl: undefined,
            certificateType: undefined,
          },
        },
      },
    };

    return API.put(DatasourcesApi.url + `/datasource-storages`, payload);
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteDatasource(id: string): Promise<any> {
    return API.delete(DatasourcesApi.url + `/${id}`);
  }

  static async fetchDatasourceStructure(
    id: string,
    ignoreCache = false,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return API.get(
      DatasourcesApi.url + `/${id}/structure?ignoreCache=${ignoreCache}`,
    );
  }

  static async fetchMockDatasources(): Promise<
    AxiosPromise<ApiResponse<Datasource[]>>
  > {
    return API.get(DatasourcesApi.url + "/mocks");
  }

  static async addMockDbToDatasources(
    name: string,
    workspaceId: string,
    pluginId: string,
    packageName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return API.post(DatasourcesApi.url + `/mocks`, {
      name,
      workspaceId,
      pluginId,
      packageName,
    });
  }

  static async executeDatasourceQuery({
    data,
    datasourceId,
  }: executeDatasourceQueryRequest) {
    return API.post(
      DatasourcesApi.url + `/${datasourceId}` + `/schema-preview`,
      data,
    );
  }

  static async executeGoogleSheetsDatasourceQuery({
    data,
    datasourceId,
  }: executeDatasourceQueryRequest) {
    return API.post(DatasourcesApi.url + `/${datasourceId}` + `/trigger`, data);
  }
}

export default DatasourcesApi;
