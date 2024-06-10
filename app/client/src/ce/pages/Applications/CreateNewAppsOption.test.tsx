import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import CreateNewAppsOption from "./CreateNewAppsOption";
import { BrowserRouter as Router } from "react-router-dom";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";

const defaultStoreState = {
  ...unitTestBaseMockStore,
  tenant: {
    tenantConfiguration: {},
  },
  entities: {
    ...unitTestBaseMockStore.entities,
    plugins: {
      list: [],
    },
    datasources: {
      list: [],
      mockDatasourceList: [],
    },
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    selectedWorkspace: {
      ...unitTestBaseMockStore.ui.selectedWorkspace,
      applications: [unitTestBaseMockStore.ui.applications.currentApplication],
    },
    debugger: {
      isOpen: false,
    },
    editor: {
      loadingStates: {},
      isProtectedMode: true,
      zoomLevel: 1,
    },
    gitSync: {
      globalGitConfig: {},
      branches: [],
      localGitConfig: {},
      disconnectingGitApp: {},
    },
    users: {
      loadingStates: {},
      list: [],
      users: [],
      error: "",
      currentUser: {},
      featureFlag: {
        data: {},
        isFetched: true,
        overriddenFlags: {},
      },
      productAlert: {
        config: {},
      },
    },
    apiPane: {
      isCreating: false,
      isRunning: {},
      isSaving: {},
      isDeleting: {},
      isDirty: {},
      extraformData: {},
      selectedConfigTabIndex: 0,
      debugger: {
        open: false,
      },
    },
  },
};
const mockStore = configureStore([]);
describe("CreateNewAppsOption", () => {
  let store: any;
  it("Should not render skip button if no application is present", () => {
    store = mockStore(defaultStoreState);

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <CreateNewAppsOption currentApplicationIdForCreateNewApp="test" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const button = screen.queryAllByTestId("t--create-new-app-option-skip");

    // Check that the skip button to be absent in the document
    expect(button).toHaveLength(0);
  });

  it("Should render skip button if application is present", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <CreateNewAppsOption currentApplicationIdForCreateNewApp="659d2e15d0cbfb0c5e0a7428" />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    const button = screen.queryAllByTestId("t--create-new-app-option-skip");

    // Check that the skip button to be present in the document
    expect(button).toHaveLength(1);
  });

  afterAll(() => {
    jest.clearAllMocks();
    store.clearActions();
  });
});
