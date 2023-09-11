import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import SwitchEnvironment from ".";
import React from "react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import { BrowserRouter as Router } from "react-router-dom";

const mockStore = configureMockStore();
const store = mockStore({
  ui: {
    workspaces: { currentWorkspace: { id: "64ba2f58abba6049fb4626da" } },
    datasourcePane: { viewMode: false },
    users: {
      featureFlag: {
        data: {
          TEST_FLAG: true,
          release_datasource_environments_enabled: true,
          ask_ai: true,
          release_appnavigationlogoupload_enabled: false,
          ask_ai_js: false,
          ask_ai_sql: false,
          release_embed_hide_share_settings_enabled: false,
          ab_ds_schema_enabled: true,
          ab_ds_binding_enabled: true,
          ab_gsheet_schema_enabled: true,
          ab_wds_enabled: false,
          release_widgetdiscovery_enabled: false,
          TEST_EE_FLAG: true,
          APP_NAVIGATION_LOGO_UPLOAD: true,
        },
      },
    },
  },
  entities: { pageList: { applicationId: "64ba2f58abba6049fb4626da" } },
  environments: {
    isLoading: false,
    showEnvDeployInfoModal: false,
    error: false,
    data: [
      {
        id: "64ba2f58abba6049fb4626de",
        name: "production",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: true,
        userPermissions: ["execute:environments"],
      },
      {
        id: "64ba2f58abba6049fb4626df",
        name: "staging",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: false,
        userPermissions: ["execute:environments"],
      },
    ],
    currentEnvironmentDetails: {
      id: "64ba2f58abba6049fb4626de",
      name: "production",
      appId: "64ba2f58abba6049fb4626da",
      workspaceId: "64ba2f58abba6049fb4626da",
      editingId: "64ba2f58abba6049fb4626de",
    },
  },
});

const onlyStagingStore = mockStore({
  ui: {
    workspaces: { currentWorkspace: { id: "64ba2f58abba6049fb4626da" } },
    datasourcePane: { viewMode: false },
    users: {
      featureFlag: {
        data: {
          TEST_FLAG: true,
          release_datasource_environments_enabled: true,
          ask_ai: true,
          release_appnavigationlogoupload_enabled: false,
          ask_ai_js: false,
          ask_ai_sql: false,
          release_embed_hide_share_settings_enabled: false,
          ab_ds_schema_enabled: true,
          ab_ds_binding_enabled: true,
          ab_gsheet_schema_enabled: true,
          ab_wds_enabled: false,
          release_widgetdiscovery_enabled: false,
          TEST_EE_FLAG: true,
          APP_NAVIGATION_LOGO_UPLOAD: true,
        },
      },
    },
  },
  entities: { pageList: { applicationId: "64ba2f58abba6049fb4626da" } },
  environments: {
    isLoading: false,
    showEnvDeployInfoModal: false,
    error: false,
    data: [
      {
        id: "64ba2f58abba6049fb4626de",
        name: "production",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: true,
        userPermissions: [],
      },
      {
        id: "64ba2f58abba6049fb4626df",
        name: "staging",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: false,
        userPermissions: ["execute:environments"],
      },
    ],
    currentEnvironmentDetails: {
      id: "64ba2f58abba6049fb4626df",
      name: "staging",
      appId: "64ba2f58abba6049fb4626da",
      workspaceId: "64ba2f58abba6049fb4626da",
      editingId: "64ba2f58abba6049fb4626df",
    },
  },
});

const noEnvAccess = mockStore({
  ui: {
    workspaces: { currentWorkspace: { id: "64ba2f58abba6049fb4626da" } },
    datasourcePane: { viewMode: false },
    users: {
      featureFlag: {
        data: {
          TEST_FLAG: true,
          release_datasource_environments_enabled: true,
          ask_ai: true,
          release_appnavigationlogoupload_enabled: false,
          ask_ai_js: false,
          ask_ai_sql: false,
          release_embed_hide_share_settings_enabled: false,
          ab_ds_schema_enabled: true,
          ab_ds_binding_enabled: true,
          ab_gsheet_schema_enabled: true,
          ab_wds_enabled: false,
          release_widgetdiscovery_enabled: false,
          TEST_EE_FLAG: true,
          APP_NAVIGATION_LOGO_UPLOAD: true,
        },
      },
    },
  },
  entities: { pageList: { applicationId: "64ba2f58abba6049fb4626da" } },
  environments: {
    isLoading: false,
    showEnvDeployInfoModal: false,
    error: false,
    data: [
      {
        id: "64ba2f58abba6049fb4626de",
        name: "production",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: true,
        userPermissions: [],
      },
      {
        id: "64ba2f58abba6049fb4626df",
        name: "staging",
        workspaceId: "64ba2f58abba6049fb4626da",
        isDefault: false,
        userPermissions: [""],
      },
    ],
    currentEnvironmentDetails: {
      id: "",
      name: "",
      appId: "64ba2f58abba6049fb4626da",
      workspaceId: "64ba2f58abba6049fb4626da",
      editingId: "",
    },
  },
});

let container: any;

describe("Switch Environment Component", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("1. renders production as default", () => {
    const { container, getByText, rerender } = render(
      <Provider store={store}>
        <Router>
          <SwitchEnvironment viewMode={false} />
        </Router>
      </Provider>,
    );

    const MainContainer = container.querySelector(
      "[data-testid='t--switch-env']",
    );
    expect(MainContainer).toBeInTheDocument();

    const selectedProdEnvironemnt = getByText("Production");
    expect(selectedProdEnvironemnt).toBeInTheDocument();

    // When production deosn't have execute permission
    // then staging should be selected by default
    rerender(
      <Provider store={onlyStagingStore}>
        <Router>
          <SwitchEnvironment viewMode={false} />
        </Router>
      </Provider>,
    );

    setTimeout(() => {
      const selectedStagEnvironemnt = getByText("Staging");
      expect(selectedStagEnvironemnt).toBeInTheDocument();
    }, 50);
  });
  it("2. Shouldn't render component when user doesn't have permission for all environment", () => {
    const { container } = render(
      <Provider store={noEnvAccess}>
        <Router>
          <SwitchEnvironment viewMode={false} />
        </Router>
      </Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
