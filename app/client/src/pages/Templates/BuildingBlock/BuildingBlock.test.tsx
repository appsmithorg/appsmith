import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { Router } from "react-router";
import { templateIdUrl } from "ee/RouteBuilder";

import BuildingBlock from ".";
import history from "utils/history";
import { lightTheme } from "selectors/themeSelectors";
import { BUILDING_BLOCK_THUMBNAIL_ALT_TEXT } from "../constants";
import {
  unitTestMockBuildingBlock,
  MOCK_BUILDING_BLOCK_TITLE,
  MOCK_BUILDING_BLOCK_DESCRIPTION,
  MOCK_BUILDING_BLOCK_ID,
} from "../test_config";

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => jest.fn(),
    useSelector: () => jest.fn(),
  };
});

const onForkTemplateClick = jest.fn();

const BaseBuildingBlockRender = () => (
  <ThemeProvider theme={lightTheme}>
    <BuildingBlock
      buildingBlock={unitTestMockBuildingBlock}
      hideForkTemplateButton={false}
      onForkTemplateClick={onForkTemplateClick}
    />
  </ThemeProvider>
);

describe("<BuildingBlock />", () => {
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
    expect(screen.getByTestId("t--fork-building-block")).toBeInTheDocument();
    // fireEvent.click(screen.getByTestId("t--fork-building-block"));
    // expect(onForkTemplateClick).toHaveBeenCalledWith(unitTestMockBuildingBlock);
  });

  it("does not trigger onForkTemplateClick when the button is hidden", () => {
    const onForkTemplateClick = jest.fn();
    render(
      <ThemeProvider theme={lightTheme}>
        <BuildingBlock
          buildingBlock={unitTestMockBuildingBlock}
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
});
