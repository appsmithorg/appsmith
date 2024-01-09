import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { TemplateLayout } from ".";
import { Router } from "react-router";
import history from "utils/history";
import { templateIdUrl } from "@appsmith/RouteBuilder";
import FixedHeightTemplate from "./FixedHeightTemplate";

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

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => jest.fn(),
    useSelector: () => jest.fn(),
  };
});

jest.mock("./LargeTemplate", () => ({
  __esModule: true,
  default: () => <div data-testid="mocked-large-template" />,
}));

const BaseTemplateRender = () => (
  <ThemeProvider theme={lightTheme}>
    <TemplateLayout hideForkTemplateButton={false} template={mockTemplate} />
  </ThemeProvider>
);

describe("<TemplateLayout />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("opens the fork modal when the fork button is clicked and no onForkTemplateClick event passed", () => {
    render(BaseTemplateRender());
    const forkButton = screen.getByTestId("t--fork-template-button");
    fireEvent.click(forkButton);
    expect(screen.getByTestId("t--fork-template-modal")).toBeInTheDocument();
  });

  it("renders fixed height template styling correctly", () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <FixedHeightTemplate
          hideForkTemplateButton={false}
          template={mockTemplate}
        />
        ,
      </ThemeProvider>,
    );

    const titleElement = screen.getByText(MOCK_TEMPLATE_TITLE);
    expect(titleElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    const categoriesElement = screen.getByText("Function1 • Function2");
    expect(categoriesElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    const descriptionElement = screen.getByText(MOCK_TEMPLATE_DESCRIPTION);
    expect(descriptionElement).toHaveStyle("height: 85px");
    expect(descriptionElement).toHaveStyle("overflow: hidden");
    expect(titleElement).toHaveStyle("display: -webkit-box");

    // Image height should be 180px
    const imageElement = screen.getByAltText("Template Thumbnail");
    expect(imageElement).toHaveStyle("height: 180px");
  });
});
