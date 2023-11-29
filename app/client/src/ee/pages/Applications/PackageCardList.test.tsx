import React from "react";
import { klona } from "klona";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import "@testing-library/jest-dom";

import store from "store";
import PackageCardList from "./PackageCardList";
import { lightTheme } from "selectors/themeSelectors";
import * as moduleFeatureSelectors from "@appsmith/selectors/moduleFeatureSelectors";
import * as packageSelectors from "@appsmith/selectors/packageSelectors";
import * as workspaceSelectors from "@appsmith/selectors/workspaceSelectors";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

jest.mock("@appsmith/selectors/moduleFeatureSelectors");
jest.mock("@appsmith/selectors/packageSelectors");
jest.mock("@appsmith/selectors/workspaceSelectors");

jest.mock("@appsmith/pages/Applications", () => ({
  NoAppsFound: ({ children }: any) => <div>{children}</div>,
}));

const setQueryModuleFeatureFlag = (value: boolean) => {
  const moduleFeatureSelectorsFactory = moduleFeatureSelectors as jest.Mocked<
    typeof moduleFeatureSelectors
  >;
  moduleFeatureSelectorsFactory.getShowQueryModule.mockImplementation(
    () => value,
  );
};

const setIsCreatingPackageSelector = (value: boolean) => {
  const packageSelectorsFactory = packageSelectors as jest.Mocked<
    typeof packageSelectors
  >;
  packageSelectorsFactory.getIsCreatingPackage.mockImplementation(() => value);
};

const setIsFetchingPackagesSelector = (value: boolean) => {
  const packageSelectorsFactory = packageSelectors as jest.Mocked<
    typeof packageSelectors
  >;
  packageSelectorsFactory.getIsFetchingPackages.mockImplementation(() => value);
};

const setGetWorkspaces = (userWorkspaces: Workspace[]) => {
  const workspaceSelectorsFactory = workspaceSelectors as jest.Mocked<
    typeof workspaceSelectors
  >;
  workspaceSelectorsFactory.getFetchedWorkspaces.mockImplementation(
    () => userWorkspaces,
  );
};

const DEFAULT_PACKAGE_LIST = [
  {
    id: "a1",
    name: "Package 1",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
  {
    id: "a2",
    name: "Package 2",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
  {
    id: "a3",
    name: "Package 3",
    workspaceId: "64f16c08c8047557ed2a7f5b",
    modifiedAt: "2023-05-09T10:22:08.010Z",
    modifiedBy: "ashit@appsmiht.com",
  },
] as Package[];

const DEFAULT_WORKSPACE_ID = "test-workspace";

const DEFAULT_USER_WORKSPACES: Workspace[] = [
  {
    id: DEFAULT_WORKSPACE_ID,
    name: "Test Workspace",
    userPermissions: [PERMISSION_TYPE.MANAGE_WORKSPACE_PACKAGES],
  },
];

describe("PackageCardList", () => {
  it("should not render anything if feature flag is disabled", async () => {
    setQueryModuleFeatureFlag(false);
    setIsCreatingPackageSelector(false);
    setIsFetchingPackagesSelector(false);
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardList
            isMobile={false}
            packages={DEFAULT_PACKAGE_LIST}
            workspace={DEFAULT_USER_WORKSPACES[0]}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );

    expect(await screen.queryByText("Packages")).not.toBeInTheDocument();
  });

  it("should not render anything if isFetchingPackages is true", async () => {
    setQueryModuleFeatureFlag(true);
    setIsCreatingPackageSelector(false);
    setIsFetchingPackagesSelector(true);
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardList
            isMobile={false}
            packages={DEFAULT_PACKAGE_LIST}
            workspace={DEFAULT_USER_WORKSPACES[0]}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );

    expect(await screen.queryByText("Packages")).not.toBeInTheDocument();
  });

  it("should not render anything manage package permission is missing", async () => {
    const userWorkspaces = klona(DEFAULT_USER_WORKSPACES);
    userWorkspaces[0].userPermissions = [];

    setGetWorkspaces(userWorkspaces);
    setQueryModuleFeatureFlag(true);
    setIsCreatingPackageSelector(false);
    setIsFetchingPackagesSelector(true);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardList
            isMobile={false}
            packages={DEFAULT_PACKAGE_LIST}
            workspace={DEFAULT_USER_WORKSPACES[0]}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );

    expect(await screen.queryByText("Packages")).not.toBeInTheDocument();
  });

  it("should render packages when flag is enabled, fetching and creating package is false and manage permission is true", async () => {
    setGetWorkspaces(DEFAULT_USER_WORKSPACES);
    setQueryModuleFeatureFlag(true);
    setIsCreatingPackageSelector(false);
    setIsFetchingPackagesSelector(false);

    render(
      <ThemeProvider theme={lightTheme}>
        <Provider store={store}>
          <PackageCardList
            isMobile={false}
            packages={DEFAULT_PACKAGE_LIST}
            workspace={DEFAULT_USER_WORKSPACES[0]}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </Provider>
      </ThemeProvider>,
    );

    expect(await screen.queryByText("Packages")).toBeInTheDocument();
  });
});
