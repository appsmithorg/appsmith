import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getAppsmithConfigs } from "ee/configs";
import type { User } from "constants/userConstants";
import HomepageHeaderAction from "../HomepageHeaderAction";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useRouteMatch: () => ({ isExact: true }),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
  useSelector: () => undefined,
}));

jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => false,
}));

jest.mock("ee/utils/airgapHelpers", () => ({
  ...jest.requireActual("ee/utils/airgapHelpers"),
  isAirgapped: () => false,
}));

jest.mock("ee/utils/licenseHelpers", () => ({
  ShowUpgradeMenuItem: () => null,
}));

jest.mock("ee/utils/BusinessFeatures/adminSettingsHelpers", () => ({
  getAdminSettingsPath: () => "",
  getShowAdminSettings: () => false,
}));

jest.mock("pages/Editor/HelpButton", () => ({
  IntercomConsent: () => null,
}));

jest.mock("utils/bootPylon", () => ({
  isPylonChatAvailable: () => false,
}));

jest.mock("utils/hooks/useBetterbugsMetadata", () => ({
  useBetterbugsMetadata: () => ({}),
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

const renderHeaderAction = () =>
  render(
    <HomepageHeaderAction
      setIsProductUpdatesModalOpen={jest.fn()}
      user={{} as User}
    />,
  );

describe("HomepageHeaderAction - help icon", () => {
  it("renders the help icon when disableHelpIcon is false", () => {
    setDisableHelpIcon(false);
    const { container } = renderHeaderAction();

    expect(container.querySelector(".t--help-menu-option")).toBeInTheDocument();
  });

  it("does not render the help icon when disableHelpIcon is true", () => {
    setDisableHelpIcon(true);
    const { container } = renderHeaderAction();

    expect(container.querySelector(".t--help-menu-option")).toBeNull();
  });
});
