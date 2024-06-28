import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
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
              authentication: this.cleanupAuthenticationObject(
                storage.datasourceConfiguration.authentication,
              ),
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
      } as any;
    }

    return API.post(DatasourcesApi.url, datasourceConfig);
  }

  static cleanupAuthenticationObject(authentication: any): any {
    if (!authentication) {
      return undefined;
    }
    const common: any = {
      authenticationType: authentication.authenticationType,
    };

    switch (authentication.authenticationType) {
      case "dbAuth":
        common.authType = authentication.authType;
        common.username = authentication.username;
        common.password = authentication.password;
        common.databaseName = authentication.databaseName;
        break;
      case "oAuth2":
        common.grantType = authentication.grantType;
        common.isTokenHeader = authentication.isTokenHeader;
        common.isAuthorizationHeader = authentication.isAuthorizationHeader;
        common.clientId = authentication.clientId;
        common.clientSecret = authentication.clientSecret;
        common.authorizationUrl = authentication.authorizationUrl;
        common.expiresIn = authentication.expiresIn;
        common.accessTokenUrl = authentication.accessTokenUrl;
        common.scopeString = authentication.scopeString;
        common.scope = authentication.scope;
        common.sendScopeWithRefreshToken =
          authentication.sendScopeWithRefreshToken;
        common.refreshTokenClientCredentialsLocation =
          authentication.refreshTokenClientCredentialsLocation;
        common.headerPrefix = authentication.headerPrefix;
        common.customTokenParameters = authentication.customTokenParameters;
        common.audience = authentication.audience;
        common.resource = authentication.resource;
        common.useSelfSignedCert = authentication.useSelfSignedCert;
        break;
      case "basic":
        common.username = authentication.username;
        common.password = authentication.password;
        break;
      case "apiKey":
        common.addTo = authentication.addTo;
        common.label = authentication.label;
        common.headerPrefix = authentication.headerPrefix;
        common.value = authentication.value;
        break;
      case "bearerToken":
        common.bearerToken = authentication.bearerToken;
        break;
      case "snowflakeKeyPairAuth":
        common.username = authentication.username;
        common.privateKey = authentication.privateKey;
        common.passphrase = authentication.passphrase;
    }

    return common;
  }

  // Api to test current environment datasource
  static async testDatasource(
    datasourceConfig: Partial<DatasourceStorage>,
    pluginId: string,
    workspaceId: string,
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
  ): Promise<any> {
    return API.put(DatasourcesApi.url + `/${id}`, datasourceConfig);
  }

  // Api to update specific datasource storage/environment configuration
  static async updateDatasourceStorage(
    datasourceStorage: Partial<DatasourceStorage>,
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

  static async deleteDatasource(id: string): Promise<any> {
    return API.delete(DatasourcesApi.url + `/${id}`);
  }

  static async fetchDatasourceStructure(
    id: string,
    ignoreCache = false,
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
