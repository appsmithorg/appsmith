import "@testing-library/jest-dom/extend-expect";
import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import UserProfile from ".";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { fetchGlobalGitConfigInit } from "actions/gitSyncActions";
import Login from "pages/UserAuth/Login";

const defaultStoreState = {
  ...unitTestBaseMockStore,
  organization: {
    organizationConfiguration: {},
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
      currentUser: {
        name: "mockUser",
        email: "mockUser@gmail.com",
      },
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

jest.mock("actions/gitSyncActions", () => ({
  fetchGlobalGitConfigInit: jest.fn(),
}));

const mockStore = configureStore([]);

describe("Git config ", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  it("Should render UserProfile component for logged in user", () => {
    store = mockStore(defaultStoreState);
    (fetchGlobalGitConfigInit as jest.Mock).mockReturnValue({
      type: ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT,
    });
    const { getAllByText, getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <UserProfile />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(getAllByText("Upload display picture")).toBeInTheDocument;
    const input = getByTestId("t--display-name");

    expect(input.getAttribute("value")).toBe("mockUser");
  });

  it("Should render Login Page for non logged in User", () => {
    store = mockStore(defaultStoreState);
    (fetchGlobalGitConfigInit as jest.Mock).mockReturnValue({
      type: ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR,
    });
    const { getAllByText } = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <Router>
            <Login />
          </Router>
        </ThemeProvider>
      </Provider>,
    );

    expect(getAllByText("Sign in to your account")).toBeInTheDocument;
  });

  afterAll(() => {
    jest.clearAllMocks();
    store.clearActions();
  });
});
