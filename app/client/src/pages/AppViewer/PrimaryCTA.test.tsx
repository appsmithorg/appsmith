import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import PrimaryCTA from "./PrimaryCTA";
import configureStore from "redux-mock-store";

jest.mock("pages/Editor/gitSync/hooks/modHooks", () => ({
  ...jest.requireActual("pages/Editor/gitSync/hooks/modHooks"),
  useGitProtectedMode: jest.fn(() => false),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useHistory: () => ({ push: jest.fn() }),
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initialState: any = {
  entities: {
    pageList: {
      applicationId: 1,
      currentPageId: "0123456789abcdef00000000",
      currentBasePageId: "0123456789abcdef00000123",
      pages: [
        {
          pageId: "0123456789abcdef00000000",
          basePageId: "0123456789abcdef00000123",
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
    gitSync: {
      protectedBranches: [],
    },
    editor: {
      isPreviewMode: false,
    },
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
        baseId: "605c435a91dea93f0eaf9123",
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
      workspaces: [],
    },
    workspaces: {
      list: [],
    },
    selectedWorkspace: {
      loadingStates: {
        isFetchingApplications: false,
      },
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
      baseId: "605c435a91dea93f0eaf9123",
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
        baseId: "605c435a91dea93f0eaf9123",
        name: "Page1",
        isDefault: true,
        slug: "page-1",
      },
      {
        id: "605c435a91dea93f0eaf91bc",
        baseId: "605c435a91dea93f0eaf9123",
        name: "Page2",
        isDefault: false,
        slug: "page-2",
      },
    ],
    workspaceId: "",
  },
};

describe("App viewer fork button", () => {
  it("Fork modal trigger should not be displayed until user details are fetched", () => {
    render(
      <Provider store={getStore()}>
        <ThemeProvider theme={lightTheme}>
          <PrimaryCTA
            navColorStyle="solid"
            primaryColor="red"
            url={"/app/test-3/page1-605c435a91dea93f0eaf9123/edit"}
          />
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
          <PrimaryCTA
            navColorStyle="solid"
            primaryColor="red"
            url={"/app/test-3/page1-605c435a91dea93f0eaf9123/edit"}
          />
        </ThemeProvider>
      </Provider>,
    );
    expect(screen.queryAllByTestId("fork-modal-trigger").length).toEqual(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    mockDispatch.mockClear();
  });
});
