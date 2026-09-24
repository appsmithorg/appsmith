import type { ReduxAction } from "actions/ReduxActionTypes";
import DatasourcesApi from "ee/api/DatasourcesApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Datasource, DatasourceStorage } from "entities/Datasource";
import type { Plugin } from "entities/Plugin";
import { testDatasourceSaga } from "./DatasourcesSagas";

jest.mock("@appsmith/ads", () => ({
  Icon: jest.fn(),
  toast: { show: jest.fn() },
}));
jest.mock("../../sagas/ActionSagas", () => ({
  createActionRequestSaga: jest.fn(),
}));
jest.mock("../../sagas/ErrorSagas", () => ({
  validateResponse: jest.fn(),
}));
jest.mock("utils/AppsmithConsole", () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn() },
}));
jest.mock("sagas/PluginSagas", () => ({
  checkAndGetPluginFormConfigsSaga: jest.fn(),
}));
jest.mock("ee/api/ApiUtils", () => ({
  getDefaultEnvId: jest.fn(),
}));
jest.mock("ee/selectors/environmentSelectors", () => ({
  getCurrentEditingEnvironmentId: jest.fn(),
  getCurrentEnvironmentDetails: jest.fn(),
  isEnvironmentFetching: jest.fn(),
}));
jest.mock("pages/common/datasourceAuth", () => ({
  AuthorizationStatus: {},
}));
jest.mock("utils/editorContextUtils", () => ({
  getFormDiffPaths: jest.fn(),
  getFormName: jest.fn(),
  isGoogleSheetPluginDS: jest.fn(),
}));
jest.mock("utils/helpers", () => ({
  klonaLiteWithTelemetry: <T>(value: T) => value,
  shouldBeDefined: <T>(value: T) => value,
  trimQueryString: (value: string) => value,
}));
jest.mock("../../sagas/helper", () => ({
  getFromServerWhenNoPrefetchedResult: jest.fn(),
  getInitialActionPayload: jest.fn(),
  getInitialDatasourcePayload: jest.fn(),
}));

describe("testDatasourceSaga", () => {
  it("retains a saved datasource id when its connection configuration changes", () => {
    const currentStorage: DatasourceStorage = {
      datasourceId: "saved-datasource-id",
      environmentId: "environment-id",
      datasourceConfiguration: { url: "https://changed.example.com" },
      isValid: true,
    };
    const datasource: Datasource = {
      id: "saved-datasource-id",
      name: "Saved datasource",
      pluginId: "plugin-id",
      workspaceId: "workspace-id",
      datasourceStorages: { "environment-id": currentStorage },
    };
    const action: ReduxAction<Datasource> = {
      type: ReduxActionTypes.TEST_DATASOURCE_INIT,
      payload: datasource,
    };
    const plugin = { id: "plugin-id" } as Plugin;
    const testDatasource = jest
      .spyOn(DatasourcesApi, "testDatasource")
      .mockReturnValue(Promise.resolve({}) as never);

    const generator = testDatasourceSaga(action) as unknown as Generator<
      unknown,
      void,
      unknown
    >;
    generator.next();
    generator.next("workspace-id");
    generator.next(datasource);
    generator.next("environment-id");
    generator.next(plugin);
    generator.next({ id: "environment-id", name: "Production" });

    expect(testDatasource).toHaveBeenCalledWith(
      expect.objectContaining({ datasourceId: "saved-datasource-id" }),
      "plugin-id",
      "workspace-id",
    );
  });
});
