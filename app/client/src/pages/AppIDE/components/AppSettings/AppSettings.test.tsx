import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "constants/DefaultTheme";
import { useEditionAppSettingsSections } from "ee/pages/AppIDE/components/AppSettings/useEditionAppSettingsSections";
import AppSettings from "./AppSettings";
import { AppSettingsTabs } from "./types";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) => selector(undefined),
}));
jest.mock("selectors/appSettingsPaneSelectors", () => ({
  getAppSettingsPane: () => ({ context: undefined }),
}));
jest.mock("ee/selectors/entitiesSelector", () => ({
  selectAllPages: () => [],
}));
jest.mock("layoutSystems/anvil/integrations/selectors", () => ({
  getIsAnvilLayout: () => false,
}));
jest.mock("ee/selectors/aiAgentSelectors", () => ({
  getIsAiAgentApp: () => false,
}));
jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { logEvent: jest.fn() },
}));
jest.mock("pages/Editor/ThemePropertyPane", () => ({
  ThemePropertyPane: () => null,
}));
jest.mock("pages/Editor/WDSThemePropertyPane", () => ({
  WDSThemePropertyPane: () => null,
}));
jest.mock("./components/GeneralSettings", () => () => null);
jest.mock("./components/DraggablePageList", () => () => null);
jest.mock("./components/PageSettings", () => () => null);
jest.mock("./components/EmbedSettings", () => () => null);
jest.mock("./components/NavigationSettings", () => () => null);
jest.mock("./components/ImportAppSettings", () => ({
  ImportAppSettings: () => null,
}));
jest.mock(
  "ee/pages/AppIDE/components/AppSettings/useEditionAppSettingsSections",
  () => ({ useEditionAppSettingsSections: jest.fn() }),
);

const mockUseEditionSections = useEditionAppSettingsSections as jest.Mock;

const BUILT_IN_SECTION_IDS = [
  "t--general-settings-header",
  "t--share-embed-settings",
  "t--theme-settings-header",
  "t--navigation-settings-header",
  "t--update-via-import",
];

function renderSettings() {
  return render(
    <ThemeProvider theme={theme}>
      <AppSettings />
    </ThemeProvider>,
  );
}

function sectionIds(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[id^='t--']")).map(
    (element) => element.id,
  );
}

describe("AppSettings edition sections", () => {
  it("shows only the built-in sections when the edition adds none", () => {
    mockUseEditionSections.mockReturnValue({
      headers: [],
      renderSection: () => null,
    });

    const { container } = renderSettings();

    expect(sectionIds(container)).toEqual(BUILT_IN_SECTION_IDS);
  });

  it("adds an edition header after the built-in ones and renders its section", () => {
    mockUseEditionSections.mockImplementation(({ setSelectedTab }) => ({
      headers: [
        {
          id: "t--edition-test-header",
          icon: "settings-v3",
          isSelected: false,
          name: "Edition section",
          onClick: () =>
            setSelectedTab({
              type: AppSettingsTabs.Edition,
              editionSectionId: "test",
            }),
          subText: "Added by an edition",
        },
      ],
      renderSection: (tab: { editionSectionId?: string }) =>
        tab.editionSectionId === "test" ? <div>edition content</div> : null,
    }));

    const { container } = renderSettings();

    expect(sectionIds(container)).toEqual([
      ...BUILT_IN_SECTION_IDS,
      "t--edition-test-header",
    ]);

    fireEvent.click(screen.getByText("Edition section"));

    expect(screen.getByText("edition content")).toBeInTheDocument();
  });

  it("renders only the content of the edition section that was clicked", () => {
    const header = (
      id: string,
      setSelectedTab: (tab: {
        type: AppSettingsTabs;
        editionSectionId?: string;
      }) => void,
    ) => ({
      id: `t--edition-${id}-header`,
      icon: "settings-v3",
      isSelected: false,
      name: `Section ${id}`,
      onClick: () =>
        setSelectedTab({
          type: AppSettingsTabs.Edition,
          editionSectionId: id,
        }),
      subText: `Edition section ${id}`,
    });

    mockUseEditionSections.mockImplementation(({ setSelectedTab }) => ({
      headers: [
        header("first", setSelectedTab),
        header("second", setSelectedTab),
      ],
      renderSection: (tab: { editionSectionId?: string }) =>
        tab.editionSectionId ? (
          <div>{`content ${tab.editionSectionId}`}</div>
        ) : null,
    }));

    renderSettings();

    fireEvent.click(screen.getByText("Section first"));

    expect(screen.getByText("content first")).toBeInTheDocument();
    expect(screen.queryByText("content second")).toBeNull();

    fireEvent.click(screen.getByText("Section second"));

    expect(screen.getByText("content second")).toBeInTheDocument();
    expect(screen.queryByText("content first")).toBeNull();
  });
});
