import type { ReduxAction } from "actions/ReduxActionTypes";
import DatasourcesApi from "ee/api/DatasourcesApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Datasource, DatasourceStorage } from "entities/Datasource";
import type { Plugin } from "entities/Plugin";
import { runSaga, type Saga } from "redux-saga";
import type { DefaultRootState } from "react-redux";
import { PluginPackageName, PluginType } from "entities/Plugin";
import * as FocusEntity from "navigation/FocusEntity";
import { INTEGRATION_TABS } from "constants/routes";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import history from "utils/history";
import {
  handleDatasourceDeleteRedirect,
  testDatasourceSaga,
} from "./DatasourcesSagas";

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

describe("handleDatasourceDeleteRedirect with hidden plugins", () => {
  const plugins = [
    {
      id: "ai-plugin",
      packageName: PluginPackageName.APPSMITH_AI,
      type: PluginType.AI,
    },
    {
      id: "pg-plugin",
      packageName: PluginPackageName.POSTGRES,
      type: PluginType.DB,
    },
  ];

  const makeState = (datasources: Array<{ id: string; pluginId: string }>) =>
    ({
      entities: {
        plugins: { list: plugins },
        datasources: { list: datasources },
      },
    }) as unknown as DefaultRootState;

  let pushSpy: jest.SpyInstance;

  beforeEach(() => {
    pushSpy = jest.spyOn(history, "push").mockImplementation(jest.fn());
    // The real route builders need a current page to build editor URLs.
    urlBuilder.setCurrentBasePageId("0123456789abcdef00000000");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runRedirect = async (
    state: DefaultRootState,
    deletedDatasourceId: string,
  ) => {
    jest.spyOn(FocusEntity, "identifyEntityFromPath").mockReturnValue({
      id: deletedDatasourceId,
    } as ReturnType<typeof FocusEntity.identifyEntityFromPath>);

    await runSaga(
      { getState: () => state, dispatch: jest.fn() },
      handleDatasourceDeleteRedirect as unknown as Saga,
      deletedDatasourceId,
    ).toPromise();
  };

  it("does not crash when the deleted datasource is hidden, and goes to a visible one", async () => {
    // ds-ai-1 is open and deleted. It is in no group, because it is hidden.
    const state = makeState([
      { id: "ds-ai-1", pluginId: "ai-plugin" },
      { id: "ds-ai-2", pluginId: "ai-plugin" },
      { id: "ds-pg", pluginId: "pg-plugin" },
    ]);

    await runRedirect(state, "ds-ai-1");

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy.mock.calls[0][0]).toContain("ds-pg");
    expect(pushSpy.mock.calls[0][0]).not.toContain("ds-ai");
  });

  it("goes to the add-datasource page when only hidden datasources are left", async () => {
    const state = makeState([
      { id: "ds-ai-1", pluginId: "ai-plugin" },
      { id: "ds-ai-2", pluginId: "ai-plugin" },
    ]);

    await runRedirect(state, "ds-ai-1");

    // integrationEditorURL with the NEW tab, not another hidden datasource.
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy.mock.calls[0][0]).toContain(INTEGRATION_TABS.NEW);
    expect(pushSpy.mock.calls[0][0]).not.toContain("ds-ai");
  });
});
