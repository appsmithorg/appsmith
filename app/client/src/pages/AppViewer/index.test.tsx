import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { setAppMode: jest.fn() },
}));

const mockUseSelector = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

// renderPage is false below, so the viewer renders null and these children are never mounted.
// They are still imported at module load, so mock them to keep the import graph light and stable.
jest.mock("./AppViewerPageContainer", () => () => null);
jest.mock("./AppViewerHtmlTitle", () => () => null);
jest.mock("./BrandingBadge", () => () => null);
jest.mock("components/editorComponents/EditorContextProvider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("globalStyles/WidgetGlobalStyles", () => ({
  WidgetGlobaStyles: () => null,
}));
jest.mock("@appsmith/wds-theming", () => ({
  ...jest.requireActual("@appsmith/wds-theming"),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: {} }),
}));
jest.mock("layoutSystems/anvil/utils/layouts/layoutUtils", () => ({
  registerLayoutComponents: jest.fn(),
}));
jest.mock("ee/entities/URLRedirect/URLAssembly", () => ({
  __esModule: true,
  default: { setCurrentBasePageId: jest.fn() },
}));
jest.mock("utils/hooks/useWidgetFocus/useWidgetFocus", () => ({
  __esModule: true,
  default: () => ({ current: null }),
}));

// Import the component first so its module graph initializes in the app's natural order; importing
// the selectors below standalone would otherwise trip an APP_MAX_WIDTH circular-dependency init error.
import AppViewer from "./index";
import { getRenderPage } from "selectors/evaluationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getPageList } from "selectors/editorSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const VIEWER_ROUTE = ["/app/application/page"];

describe("AppViewer analytics app mode", () => {
  beforeEach(() => {
    (AnalyticsUtil.setAppMode as jest.Mock).mockClear();
    mockUseSelector.mockImplementation((selector: unknown) => {
      // Returning false short-circuits the render to null, keeping the test light while the
      // lifecycle effects (including the app-mode cleanup under test) still run.
      if (selector === getRenderPage) return false;

      if (selector === getSelectedAppTheme) {
        return {
          properties: {
            fontFamily: { appFont: "System Default" },
            colors: { primaryColor: "#000", backgroundColor: "#fff" },
          },
        };
      }

      if (selector === getPageList) return [];

      return undefined;
    });
  });

  it("clears the analytics app mode when the viewer unmounts, regardless of exit path", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={VIEWER_ROUTE}>
        <AppViewer />
      </MemoryRouter>,
    );

    // While the viewer is mounted the published mode set by the engine must stand.
    expect(AnalyticsUtil.setAppMode).not.toHaveBeenCalled();

    // Leaving the viewer by any route unmounts this component and must reset the mode so that
    // builder events (e.g. CREATE_APP on the applications page) are no longer suppressed.
    unmount();

    expect(AnalyticsUtil.setAppMode).toHaveBeenCalledWith(undefined);
  });
});
