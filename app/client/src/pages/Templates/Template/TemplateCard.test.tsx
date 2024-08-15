import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { TemplateLayout } from ".";
import { Router } from "react-router";
import history from "utils/history";
import { templateIdUrl } from "ee/RouteBuilder";
import FixedHeightTemplate from "./FixedHeightTemplate";
import { unitTestMockTemplate } from "../test_config";

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => jest.fn(),
    useSelector: () => jest.fn(),
  };
});

const BaseTemplateRender = () => (
  <ThemeProvider theme={lightTheme}>
    <TemplateLayout
      hideForkTemplateButton={false}
      template={unitTestMockTemplate}
    />
  </ThemeProvider>
);

describe("<TemplateLayout />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders template details correctly", () => {
    render(<BaseTemplateRender />);
    expect(screen.getByText(unitTestMockTemplate.title)).toBeInTheDocument();
    expect(
      screen.getByText(unitTestMockTemplate.description),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Template Thumbnail")).toBeInTheDocument();
  });

  it("navigates to the template URL when clicked", () => {
    render(<Router history={history}>{BaseTemplateRender()}</Router>);
    const pushMock = jest.spyOn(history, "push");
    fireEvent.click(screen.getByText(unitTestMockTemplate.title));
    expect(pushMock).toHaveBeenCalledWith(
      templateIdUrl({ id: unitTestMockTemplate.id }),
    );
  });

  it("does not trigger onForkTemplateClick when the button is hidden", () => {
    const onForkTemplateClick = jest.fn();
    render(
      <ThemeProvider theme={lightTheme}>
        <TemplateLayout
          hideForkTemplateButton
          onForkTemplateClick={onForkTemplateClick}
          template={unitTestMockTemplate}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText(unitTestMockTemplate.title));
    expect(onForkTemplateClick).not.toHaveBeenCalled();
  });

  it("renders fixed height template styling correctly", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <FixedHeightTemplate
          hideForkTemplateButton={false}
          template={unitTestMockTemplate}
        />
        ,
      </ThemeProvider>,
    );

    const titleElement = screen.getByText(unitTestMockTemplate.title);
    expect(titleElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    const categoriesElement = screen.getByText(
      "Operations • Communications • All",
    );
    expect(categoriesElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    const descriptionElement = screen.getByText(
      unitTestMockTemplate.description,
    );
    expect(descriptionElement).toHaveStyle("height: 85px");
    expect(descriptionElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    const imageElement = screen.getByAltText("Template Thumbnail");
    expect(imageElement).toHaveStyle("height: 180px");
  });
});
