import { renderHook } from "@testing-library/react-hooks";
import { getAppsmithConfigs } from "ee/configs";
import type { ThemeProp } from "WidgetProvider/types";
import { useNavigationMenuData } from "../useNavigationMenuData";

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: jest.fn(() => actual.getAppsmithConfigs()),
  };
});

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
  useSelector: () => undefined,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({ push: jest.fn() }),
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

const getVisibleMenuTexts = () => {
  const { result } = renderHook(() =>
    useNavigationMenuData({
      editMode: jest.fn(),
      setForkApplicationModalOpen: jest.fn(),
      theme: {} as ThemeProp["theme"],
    }),
  );

  return result.current
    .filter((item) => item.isVisible)
    .map((item) => item.text);
};

describe("useNavigationMenuData - Help submenu", () => {
  it("shows the Help submenu when disableHelpIcon is false", () => {
    setDisableHelpIcon(false);

    expect(getVisibleMenuTexts()).toContain("Help");
  });

  it("hides the Help submenu and its divider when disableHelpIcon is true", () => {
    setDisableHelpIcon(true);
    const visibleTexts = getVisibleMenuTexts();

    expect(visibleTexts).not.toContain("Help");
    expect(visibleTexts).not.toContain("divider_2");
  });
});
