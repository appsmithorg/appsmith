import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { Router } from "react-router";
import { templateIdUrl } from "@appsmith/RouteBuilder";
import { TemplateLayout } from ".";
import history from "utils/history";
import { lightTheme } from "selectors/themeSelectors";

const MOCK_TEMPLATE_TITLE = "Test Template";
const MOCK_TEMPLATE_DESCRIPTION = "Description of the test template";
const MOCK_TEMPLATE_ID = "mockId";

const mockTemplate = {
  id: MOCK_TEMPLATE_ID,
  userPermissions: ["read", "write"],
  title: MOCK_TEMPLATE_TITLE,
  description: MOCK_TEMPLATE_DESCRIPTION,
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

const BaseTemplateRender = () => (
  <ThemeProvider theme={lightTheme}>
    <TemplateLayout
      hideForkTemplateButton={false}
      size="large"
      template={mockTemplate}
    />
  </ThemeProvider>
);

describe("Template Component", () => {
  beforeEach(() => {
    // Clear any mocks or side-effects
  });

  it("renders template details correctly", () => {
    render(BaseTemplateRender());
    expect(screen.getByText(MOCK_TEMPLATE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEMPLATE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByAltText("Template Thumbnail")).toBeInTheDocument();
  });

  it("navigates to the template URL when clicked", () => {
    render(<Router history={history}>{BaseTemplateRender()}</Router>);
    const pushMock = jest.spyOn(history, "push");
    fireEvent.click(screen.getByText(MOCK_TEMPLATE_TITLE));
    expect(pushMock).toHaveBeenCalledWith(
      templateIdUrl({ id: MOCK_TEMPLATE_ID }),
    );
  });

  it("triggers onForkTemplateClick when the fork button is clicked", () => {
    const onForkTemplateClick = jest.fn();
    render(
      <ThemeProvider theme={lightTheme}>
        <TemplateLayout
          hideForkTemplateButton={false}
          onForkTemplateClick={onForkTemplateClick}
          template={mockTemplate}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByTestId("template-card"));
    expect(onForkTemplateClick).toHaveBeenCalledWith(mockTemplate);
  });

  it("does not trigger onForkTemplateClick when the button is hidden", () => {
    const onForkTemplateClick = jest.fn();
    render(
      <ThemeProvider theme={lightTheme}>
        <TemplateLayout
          hideForkTemplateButton
          onForkTemplateClick={onForkTemplateClick}
          template={mockTemplate}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText(MOCK_TEMPLATE_TITLE));
    expect(onForkTemplateClick).not.toHaveBeenCalled();
  });

  it("opens the fork modal when the fork button is clicked", () => {
    render(BaseTemplateRender());
    const forkButton = screen.getByTestId("t--fork-template");
    fireEvent.click(forkButton);
    expect(screen.getByTestId("t--fork-template-modal")).toBeInTheDocument();
  });
});
