import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { navigateToAnotherPage } from "actions/pageActions";
import {
  NAVIGATION_SETTINGS,
  defaultNavigationSetting,
} from "constants/AppConstants";
import * as RouteBuilder from "ee/RouteBuilder";
import { APP_MODE } from "entities/App";
import type { AppTheme } from "entities/AppTheming";
import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import React from "react";
import { Provider, type DefaultRootState } from "react-redux";
import configureStore from "redux-mock-store";
import { NavigationMethod } from "utils/history";
import type { MenuItemProps } from "./types";
import MenuItem from ".";

const mockStore = configureStore([]);

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
}));

jest.mock("../MenuItem.styled", () => ({
  StyledMenuItem: jest.fn(({ children, ...props }) => (
    <div data-testid="styled-menu-item" {...props}>
      {children}
    </div>
  )),
}));

jest.mock("../MenuText", () =>
  jest.fn((props) => (
    <div data-testid="menu-text" {...props}>
      {props.name}
    </div>
  )),
);

jest.mock("actions/pageActions", () => ({
  navigateToAnotherPage: jest.fn((payload) => ({
    type: "NAVIGATE_TO_PAGE", // Mock action type
    payload,
  })),
}));

// Mock the selectors and utilities
jest.mock("ee/selectors/applicationSelectors", () => ({
  getAppMode: jest.fn(),
  getCurrentApplication: jest.fn(),
}));

jest.mock("selectors/appThemingSelectors", () => ({
  getSelectedAppTheme: jest.fn(),
}));

jest.mock("pages/Editor/utils", () => ({
  useHref: jest.fn(),
}));

jest.mock("ee/RouteBuilder", () => ({
  viewerURL: jest.fn(),
  builderURL: jest.fn(),
}));

// Mock the useNavigateToAnotherPage hook
jest.mock("../../hooks/useNavigateToAnotherPage", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

const mockPage: Page = {
  pageId: "page1_id",
  pageName: "Test Page 1",
  basePageId: "base_page1_id",
  isDefault: true,
  isHidden: false,
  slug: "test-page-1",
};
const mockQuery = "param=value";

describe("MenuItem Component", () => {
  const mockStoreInstance = mockStore();

  let store: typeof mockStoreInstance;

  const renderComponent = (
    props: Partial<MenuItemProps> = {},
    initialState: Partial<DefaultRootState> = {},
    currentPathname = "/app/page1_id/section",
    appMode?: APP_MODE,
  ) => {
    const testState = getTestState(initialState, appMode);

    store = mockStore(testState);

    // Setup mocks
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { useHref } = require("pages/Editor/utils");
    const { getAppMode } = require("ee/selectors/applicationSelectors");
    const { getSelectedAppTheme } = require("selectors/appThemingSelectors");
    const { builderURL, viewerURL } = require("ee/RouteBuilder");
    /* eslint-enable @typescript-eslint/no-var-requires */

    useHref.mockImplementation(
      (
        urlBuilder:
          | typeof RouteBuilder.viewerURL
          | typeof RouteBuilder.builderURL,
        params: { basePageId: string },
      ) => {
        if (urlBuilder === RouteBuilder.viewerURL) {
          return `/viewer/${params.basePageId}`;
        }

        return `/builder/${params.basePageId}`;
      },
    );

    getAppMode.mockImplementation(() => testState.entities.app.mode);

    getSelectedAppTheme.mockImplementation(
      () => testState.ui.appTheming.selectedTheme,
    );

    viewerURL.mockImplementation(
      (params: { basePageId: string }) => `/viewer/${params.basePageId}`,
    );
    builderURL.mockImplementation(
      (params: { basePageId: string }) => `/builder/${params.basePageId}`,
    );

    /* eslint-disable @typescript-eslint/no-var-requires */
    (require("react-router-dom").useLocation as jest.Mock).mockReturnValue({
      pathname: currentPathname,
    });

    // Mock the useNavigateToAnotherPage hook
    const useNavigateToAnotherPageMock =
      require("../../hooks/useNavigateToAnotherPage").default;

    useNavigateToAnotherPageMock.mockImplementation(() => {
      return () => {
        const pageURL =
          testState.entities.app.mode === APP_MODE.PUBLISHED
            ? `/viewer/${mockPage.basePageId}`
            : `/builder/${mockPage.basePageId}`;

        store.dispatch(
          navigateToAnotherPage({
            pageURL,
            query: mockQuery,
            state: { invokedBy: NavigationMethod.AppNavigation },
          }),
        );
      };
    });

    return render(
      <Provider store={store}>
        <MenuItem
          navigationSetting={{
            ...defaultNavigationSetting,
            colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
          }}
          page={mockPage}
          query={mockQuery}
          {...props}
        />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page name", () => {
    renderComponent();
    expect(screen.getByText("Test Page 1")).toBeInTheDocument();
    expect(screen.getByTestId("menu-text")).toHaveAttribute(
      "name",
      "Test Page 1",
    );
  });

  it("is marked active if current path matches pageId", () => {
    renderComponent(undefined, undefined, "/app/some-app/page1_id/details");
    expect(screen.getByTestId("styled-menu-item")).toHaveClass("is-active");
  });

  it("is not marked active if current path does not match pageId", () => {
    renderComponent(undefined, undefined, "/app/some-app/page2_id/details");
    expect(screen.getByTestId("styled-menu-item")).not.toHaveClass("is-active");
  });

  it("dispatches navigateToAnotherPage on click in PUBLISHED mode", () => {
    renderComponent(undefined, {}, "/app/page1_id/section", APP_MODE.PUBLISHED);

    fireEvent.click(screen.getByTestId("styled-menu-item"));

    expect(navigateToAnotherPage).toHaveBeenCalledWith({
      pageURL: `/viewer/${mockPage.basePageId}`,
      query: mockQuery,
      state: { invokedBy: NavigationMethod.AppNavigation },
    });
    expect(store.getActions()).toContainEqual(
      expect.objectContaining({
        type: "NAVIGATE_TO_PAGE",
        payload: {
          pageURL: `/viewer/${mockPage.basePageId}`,
          query: mockQuery,
          state: { invokedBy: NavigationMethod.AppNavigation },
        },
      }),
    );
  });

  it("dispatches navigateToAnotherPage on click in EDIT mode", () => {
    renderComponent(undefined, {}, "/app/page1_id/section", APP_MODE.EDIT);

    fireEvent.click(screen.getByTestId("styled-menu-item"));

    expect(navigateToAnotherPage).toHaveBeenCalledWith({
      pageURL: `/builder/${mockPage.basePageId}`,
      query: mockQuery,
      state: { invokedBy: NavigationMethod.AppNavigation },
    });
    expect(store.getActions()).toContainEqual(
      expect.objectContaining({
        type: "NAVIGATE_TO_PAGE",
        payload: {
          pageURL: `/builder/${mockPage.basePageId}`,
          query: mockQuery,
          state: { invokedBy: NavigationMethod.AppNavigation },
        },
      }),
    );
  });

  it("passes correct props to StyledMenuItem and MenuText", () => {
    renderComponent({
      navigationSetting: {
        ...defaultNavigationSetting,
        colorStyle: NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT,
      },
    });

    const styledMenuItem = screen.getByTestId("styled-menu-item");

    expect(styledMenuItem).toHaveAttribute("primarycolor", "blue");
    expect(styledMenuItem).toHaveAttribute("borderradius", "4px");

    const menuText = screen.getByTestId("menu-text");

    expect(menuText).toHaveAttribute("primarycolor", "blue");
  });

  it("uses default navigation color style if not provided", () => {
    renderComponent({ navigationSetting: defaultNavigationSetting });
    expect(screen.getByTestId("styled-menu-item")).toHaveAttribute(
      "navcolorstyle",
      NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT, // Default
    );
  });
});

const mockSelectedTheme: AppTheme = {
  id: "theme1",
  name: "Test Theme",
  displayName: "Test Theme",
  created_by: "user1",
  created_at: "2023-01-01",
  isSystemTheme: false,
  config: {
    order: 1,
    colors: {
      primaryColor: "blue",
      backgroundColor: "white",
    },
    borderRadius: {},
    boxShadow: {},
    fontFamily: {},
  },
  stylesheet: {},
  properties: {
    colors: { primaryColor: "blue", backgroundColor: "white" },
    borderRadius: { appBorderRadius: "4px" },
    boxShadow: {},
    fontFamily: {},
  },
};

const mockApplication: ApplicationPayload = {
  id: "app1",
  baseId: "base_app1",
  name: "Test App",
  workspaceId: "workspace1",
  defaultPageId: "page1_id",
  defaultBasePageId: "base_page1_id",
  appIsExample: false,
  slug: "test-app",
  pages: [
    {
      id: "page1_id",
      baseId: "base_page1_id",
      name: "Test Page 1",
      isDefault: true,
      slug: "test-page-1",
    },
  ],
  applicationVersion: 1,
};

const getTestState = (
  overrides: Partial<DefaultRootState> = {},
  appMode?: APP_MODE,
): DefaultRootState => {
  return {
    ui: {
      appTheming: {
        selectedTheme: mockSelectedTheme,
        isSaving: false,
        isChanging: false,
        stack: [],
        themes: [],
        themesLoading: false,
        selectedThemeLoading: false,
        isBetaCardShown: false,
      },
      applications: {
        currentApplication: mockApplication,
        applicationList: [],
        searchKeyword: undefined,
        isSavingAppName: false,
        isErrorSavingAppName: false,
        isFetchingApplication: false,
        isChangingViewAccess: false,
        creatingApplication: {},
        createApplicationError: undefined,
        deletingApplication: false,
        forkingApplication: false,
        importingApplication: false,
        importedApplication: undefined,
        isImportAppModalOpen: false,
        workspaceIdForImport: undefined,
        pageIdForImport: "",
        isDatasourceConfigForImportFetched: undefined,
        isAppSidebarPinned: false,
        isSavingNavigationSetting: false,
        isErrorSavingNavigationSetting: false,
        isUploadingNavigationLogo: false,
        isDeletingNavigationLogo: false,
        loadingStates: {
          isFetchingAllRoles: false,
          isFetchingAllUsers: false,
        },
        currentApplicationIdForCreateNewApp: undefined,
        partialImportExport: {
          isExportModalOpen: false,
          isExporting: false,
          isExportDone: false,
          isImportModalOpen: false,
          isImporting: false,
          isImportDone: false,
        },
        currentPluginIdForCreateNewApp: undefined,
      },
      ...overrides.ui,
    } as DefaultRootState["ui"],
    entities: {
      app: {
        mode: appMode || overrides.entities?.app?.mode || APP_MODE.PUBLISHED,
        user: { username: "", email: "", id: "" },
        URL: {
          queryParams: {},
          protocol: "",
          host: "",
          hostname: "",
          port: "",
          pathname: "",
          hash: "",
          fullPath: "",
        },
        store: {},
        geolocation: { canBeRequested: false },
        workflows: {},
      },
      pageList: {
        pages: [mockPage],
        baseApplicationId: "base_app1",
        applicationId: "app1",
        currentBasePageId: "base_page1_id",
        currentPageId: "page1_id",
        defaultBasePageId: "base_page1_id",
        defaultPageId: "page1_id",
        loading: {},
      },
      canvasWidgets: {},
      metaWidgets: {},
      actions: [],
      jsActions: [],
      /* eslint-disable @typescript-eslint/no-explicit-any */
      plugins: {} as any,
      /* eslint-disable @typescript-eslint/no-explicit-any */
      datasources: {} as any,
      meta: {},
      moduleInstanceEntities: {},
      ...overrides.entities,
    } as DefaultRootState["entities"],
    ...overrides,
  } as DefaultRootState;
};
