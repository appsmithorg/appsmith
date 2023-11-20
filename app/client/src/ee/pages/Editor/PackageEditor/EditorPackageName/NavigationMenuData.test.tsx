import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { GetNavigationMenuData } from "./NavigationMenuData";
import { noop } from "lodash";
import "@testing-library/jest-dom";
import "jest-styled-components";
import { defaultTheme } from "react-select";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

// Mock useDispatch and useSelector
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock useHistory
jest.mock("react-router-dom", () => ({
  useHistory: jest.fn(),
}));

jest.mock("design-system", () => ({
  toast: {
    show: jest.fn(),
  },
}));

const allPackagePermissions = [PERMISSION_TYPE.DELETE_PACKAGE];

const mockPackagePermissions = (filter: string[] = []) => {
  if (filter.length > 0) {
    const result = allPackagePermissions.filter(
      (permission) => !filter.includes(permission),
    );
    return result;
  }
  return allPackagePermissions;
};

describe("GetNavigationMenuData", () => {
  let mockDispatch: any, mockUseSelector: any, mockHistory: any;
  const theme = defaultTheme as any;

  beforeEach(() => {
    // Mock the useDispatch and useSelector functions
    mockDispatch = jest.fn();
    mockUseSelector = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation(mockUseSelector);

    // Mock the useHistory function
    mockHistory = { replace: jest.fn() };
    (useHistory as jest.Mock).mockReturnValue(mockHistory);
  });

  it("renders navigation menu data correctly", () => {
    // Mock the current package and related data
    mockUseSelector.mockReturnValue({
      id: "package123",
      userPermissions: ["edit", "delete"],
    });

    jest
      .spyOn(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("@appsmith/utils/permissionHelpers"),
        "hasDeletePackagePermission",
      )
      .mockImplementation(() =>
        mockPackagePermissions([PERMISSION_TYPE.DELETE_PACKAGE]),
      );

    // Render the function within a ThemeProvider
    const container = GetNavigationMenuData({
      editMode: noop,
      theme,
    });

    // Verify that the expected navigation items are rendered
    const homeMenuItem = container.find((arr) => arr.text === "Home");
    const editNameMenuItem = container.find((arr) => arr.text === "Edit name");
    const helpMenuItem = container.find((arr) => arr.text === "Help");
    const deletePackageMenuItem = container.find(
      (arr) => arr.text === "Delete package",
    );

    expect(homeMenuItem).toBeTruthy();
    expect(editNameMenuItem).toBeTruthy();
    expect(helpMenuItem).toBeTruthy();
    expect(deletePackageMenuItem).toBeTruthy();

    const communityForumMenuItem = helpMenuItem?.children?.find(
      (arr) => arr.text === "Community forum",
    );
    const discordMenuItem = helpMenuItem?.children?.find(
      (arr) => arr.text === "Discord channel",
    );
    const githubMenuItem = helpMenuItem?.children?.find(
      (arr) => arr.text === "Github",
    );
    const docsMenuItem = helpMenuItem?.children?.find(
      (arr) => arr.text === "Documentation",
    );

    expect(communityForumMenuItem).toBeTruthy();
    expect(discordMenuItem).toBeTruthy();
    expect(githubMenuItem).toBeTruthy();
    expect(docsMenuItem).toBeTruthy();
  });
});
