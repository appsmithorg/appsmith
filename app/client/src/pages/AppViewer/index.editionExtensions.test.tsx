import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
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

jest.mock("ee/pages/AppViewer/ViewerEditionExtensions", () => ({
  ViewerEditionExtensions: () => <div>edition extensions marker</div>,
}));
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

// Import the component first so its module graph initializes in the app's natural order.
import AppViewer from "./index";
import { getRenderPage } from "selectors/evaluationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getPageList } from "selectors/editorSelectors";
import { getIsInitialized } from "selectors/appViewSelectors";
import { theme } from "constants/DefaultTheme";

const VIEWER_ROUTE = ["/app/application/page"];

function mockSelectors(isInitialized: boolean) {
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === getRenderPage) return true;

    if (selector === getIsInitialized) return isInitialized;

    if (selector === getSelectedAppTheme) {
      return {
        properties: {
          fontFamily: { appFont: "System Default" },
          colors: { primaryColor: "#000", backgroundColor: "#fff" },
        },
      };
    }

    if (selector === getPageList) return [];

    // The viewer passes an inline selector for its light theme.
    if (typeof selector === "function" && selector.name === "") return theme;

    return undefined;
  });
}

function renderViewer() {
  return render(
    <MemoryRouter initialEntries={VIEWER_ROUTE}>
      <AppViewer />
    </MemoryRouter>,
  );
}

describe("AppViewer edition extensions", () => {
  it("does not render the edition extensions before the app is initialized", () => {
    mockSelectors(false);
    renderViewer();

    expect(screen.queryByText("edition extensions marker")).toBeNull();
  });

  it("renders the edition extensions once the app is initialized", () => {
    mockSelectors(true);
    renderViewer();

    expect(screen.getByText("edition extensions marker")).toBeInTheDocument();
  });
});
