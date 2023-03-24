import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import PrimaryCTA from "./PrimaryCTA";
import configureStore from "redux-mock-store";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: () => ({
    pathname: "/app/test-3/page1-63cccd44463c535b9fbc297c",
    search: "?fork=true",
  }),
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

export const initialState: any = {
  entities: {
    pageList: {
      applicationId: 1,
      currentPageId: 1,
      pages: [
        {
          pageId: 1,
          slug: "pageSlug",
        },
      ],
    },
    datasources: {
      list: [],
    },
    actions: [],
    canvasWidgets: {
      main_component: {},
    },
  },
  ui: {
    appSettingsPane: {
      isOpen: false,
    },
    appTheming: {
      selectedTheme: {
        properties: {
          colors: {
            primaryColor: "",
          },
          borderRadius: {
            appBorderRadius: "",
          },
        },
      },
    },
    applications: {
      currentApplication: {
        id: "605c435a91dea93f0eaf91b8",
        name: "My Application",
        slug: "my-application",
        workspaceId: "",
        evaluationVersion: 1,
        appIsExample: false,
        gitApplicationMetadata: undefined,
        applicationVersion: 2,
        forkingEnabled: true,
        isPublic: true,
      },
      userWorkspaces: [],
    },
    theme: {
      theme: {
        colors: {
          applications: {
            iconColor: "#f2f2f2",
          },
          success: {
            main: "#e2e2e2",
          },
        },
      },
    },
    users: {
      currentUser: undefined,
    },
  },
};
const state = JSON.parse(JSON.stringify(initialState));
const mockStore = configureStore();

export function getStore(action?: string) {
  switch (action) {
    case "SET_CURRENT_USER_DETAILS":
      state.ui.users.currentUser = {
        username: "test",
      };
      break;
  }
  return mockStore(state);
}

export const fetchApplicationMockResponse = {
  responseMeta: {
    status: 200,
    success: true,
  },
  data: {
    application: {
      id: "605c435a91dea93f0eaf91b8",
      name: "My Application",
      slug: "my-application",
      workspaceId: "",
      evaluationVersion: 1,
      appIsExample: false,
      gitApplicationMetadata: undefined,
      applicationVersion: 2,
      forkingEnabled: true,
      isPublic: true,
    },
    pages: [
      {
        id: "605c435a91dea93f0eaf91ba",
        name: "Page1",
        isDefault: true,
        slug: "page-1",
      },
      {
        id: "605c435a91dea93f0eaf91bc",
        name: "Page2",
        isDefault: false,
        slug: "page-2",
      },
    ],
    workspaceId: "",
  },
};

describe("App viewer fork button", () => {
  afterEach(cleanup);

  it("Fork modal trigger should not be displayed until user details are fetched", () => {
    render(
      <Provider store={getStore()}>
        <ThemeProvider theme={lightTheme}>
          <PrimaryCTA navColorStyle="solid" primaryColor="red" />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.queryAllByTestId("fork-modal-trigger").length).toEqual(0);
    expect(mockDispatch).toHaveBeenCalledTimes(0);
    mockDispatch.mockClear();
  });
  it("Fork modal trigger should be displayed when user details are defined and user is not anonymous", () => {
    render(
      <Provider store={getStore("SET_CURRENT_USER_DETAILS")}>
        <ThemeProvider theme={lightTheme}>
          <PrimaryCTA navColorStyle="solid" primaryColor="red" />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.queryAllByTestId("fork-modal-trigger").length).toEqual(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    mockDispatch.mockClear();
  });
});
