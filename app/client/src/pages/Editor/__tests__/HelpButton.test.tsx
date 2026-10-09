import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { getAppsmithConfigs } from "ee/configs";
// Load editorSelectors before onboardingSelectors, as the app does, so their
// circular import resolves.
import "selectors/editorSelectors";
import HelpButton from "../HelpButton";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

// Every selector returns undefined except the unread-steps list, which
// HelpButton reads `.length` from.
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
  useSelector: (selector: unknown) =>
    selector ===
    jest.requireActual("selectors/onboardingSelectors")
      .getSignpostingUnreadSteps
      ? []
      : undefined,
}));

jest.mock("pages/Editor/FirstTimeUserOnboarding/Modal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("utils/bootPylon", () => ({
  __esModule: true,
  default: jest.fn(),
  isPylonChatAvailable: () => false,
  updatePylonChatIdentity: jest.fn(),
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

const renderHelpButton = () => render(<HelpButton />);

describe("HelpButton - disableHelpIcon", () => {
  it("renders the help button when disableHelpIcon is false", () => {
    setDisableHelpIcon(false);
    renderHelpButton();

    expect(screen.getByTestId("t--help-button")).toBeInTheDocument();
  });

  it("renders nothing when disableHelpIcon is true", () => {
    setDisableHelpIcon(true);
    renderHelpButton();

    expect(screen.queryByTestId("t--help-button")).toBeNull();
  });
});
