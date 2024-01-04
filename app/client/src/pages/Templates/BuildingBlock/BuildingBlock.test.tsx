import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { Router } from "react-router";
import { templateIdUrl } from "@appsmith/RouteBuilder";

import BuildingBlock from ".";
import history from "utils/history";
import type { Template } from "api/TemplatesApi";
import { lightTheme } from "selectors/themeSelectors";
import { BUILDING_BLOCK_THUMBNAIL_ALT_TEXT } from "../constants";

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => jest.fn(),
    useSelector: () => jest.fn(),
  };
});

const onForkTemplateClick = jest.fn();

const MOCK_BUILDING_BLOCK_TITLE = "Test Building Block";
const MOCK_BUILDING_BLOCK_DESCRIPTION =
  "Description of the test building block";
const MOCK_BUILDING_BLOCK_ID = "mockId";

const mockBuildingBlock: Template = {
  id: MOCK_BUILDING_BLOCK_ID,
  userPermissions: ["read", "write"],
  title: MOCK_BUILDING_BLOCK_TITLE,
  description: MOCK_BUILDING_BLOCK_DESCRIPTION,
  appUrl: "https://mockapp.com",
  gifUrl: "https://mockapp.com/mock.gif",
  screenshotUrls: [
    "https://mockapp.com/screenshot1.jpg",
    "https://mockapp.com/screenshot2.jpg",
  ],
  widgets: [],
  functions: ["Function1", "Function2"],
  useCases: ["UseCase1", "UseCase2"],
  datasources: ["Datasource1", "Datasource2"],
  pages: [],
  allowPageImport: true,
};

const BaseBuildingBlockRender = () => (
  <ThemeProvider theme={lightTheme}>
    <BuildingBlock
      buildingBlock={mockBuildingBlock}
      hideForkTemplateButton={false}
      onForkTemplateClick={onForkTemplateClick}
    />
  </ThemeProvider>
);

describe("BuildingBlock Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders building block details correctly", () => {
    render(BaseBuildingBlockRender());
    expect(screen.getByText(MOCK_BUILDING_BLOCK_TITLE)).toBeInTheDocument();
    expect(
      screen.getByText(MOCK_BUILDING_BLOCK_DESCRIPTION),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(BUILDING_BLOCK_THUMBNAIL_ALT_TEXT),
    ).toBeInTheDocument();
  });

  it("navigates to the template URL when clicked", async () => {
    render(<Router history={history}>{BaseBuildingBlockRender()}</Router>);
    const pushMock = jest.spyOn(history, "push");
    fireEvent.click(screen.getByText(MOCK_BUILDING_BLOCK_TITLE));
    expect(pushMock).toHaveBeenCalledWith(
      templateIdUrl({ id: MOCK_BUILDING_BLOCK_ID }),
    );
  });

  it("triggers onForkTemplateClick when the fork button is clicked", async () => {
    render(BaseBuildingBlockRender());
    fireEvent.click(screen.getByTestId("t--fork-building-block"));
    expect(onForkTemplateClick).toHaveBeenCalledWith(mockBuildingBlock);
  });

  it("does not trigger onForkTemplateClick when the button is hidden", () => {
    const onForkTemplateClick = jest.fn();
    render(
      <ThemeProvider theme={lightTheme}>
        <BuildingBlock
          buildingBlock={mockBuildingBlock}
          hideForkTemplateButton
          onForkTemplateClick={onForkTemplateClick}
        />
      </ThemeProvider>,
    );
    const forkButton = screen.queryByTestId("t--fork-building-block");
    expect(forkButton).toBeNull();
    fireEvent.click(screen.getByText(MOCK_BUILDING_BLOCK_TITLE));
    expect(onForkTemplateClick).not.toHaveBeenCalled();
  });

  it("opens the fork modal when the fork button is clicked", async () => {
    render(BaseBuildingBlockRender());
    const forkButton = screen.getByTestId("t--fork-building-block");
    fireEvent.click(forkButton);
    expect(screen.getByTestId("t--fork-template-modal")).toBeInTheDocument();
  });
});
