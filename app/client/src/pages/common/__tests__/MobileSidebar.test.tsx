import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { getAppsmithConfigs } from "ee/configs";
import MobileSideBar from "../MobileSidebar";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: () => undefined,
}));

jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => false,
}));

const mockGetAppsmithConfigs = getAppsmithConfigs as jest.Mock;
const { getAppsmithConfigs: getActualAppsmithConfigs } =
  jest.requireActual("ee/configs");

const setDisableHelpIcon = (disableHelpIcon: boolean) => {
  mockGetAppsmithConfigs.mockReturnValue({
    ...getActualAppsmithConfigs(),
    disableHelpIcon,
  });
};

const renderSidebar = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <MobileSideBar isOpen name="Test User" userName="test@example.com" />
    </ThemeProvider>,
  );

describe("MobileSideBar - help links", () => {
  it("shows the Discord and Documentation links when disableHelpIcon is false", () => {
    setDisableHelpIcon(false);
    renderSidebar();

    expect(screen.getByText("Join our discord")).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("hides the Discord and Documentation links when disableHelpIcon is true", () => {
    setDisableHelpIcon(true);
    renderSidebar();

    expect(screen.queryByText("Join our discord")).toBeNull();
    expect(screen.queryByText("Documentation")).toBeNull();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
