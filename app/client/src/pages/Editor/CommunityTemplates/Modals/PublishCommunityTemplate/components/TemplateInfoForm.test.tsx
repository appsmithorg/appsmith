import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import TemplateInfoForm from "./TemplateInfoForm";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "selectors/themeSelectors";
import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";

const TEMPLATE_NAME = "View Data";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(),
}));

jest.mock("selectors/templatesSelectors", () => ({
  allTemplatesFiltersSelector: jest.fn(() => ({
    useCases: ["Case1", "Case2"],
  })),
}));

const mockStore = configureStore();
const store = mockStore({});

describe("<TemplateInfoForm />", () => {
  const mockProps = {
    setTemplateDescription: jest.fn(),
    setTemplateExcerpt: jest.fn(),
    setTemplateName: jest.fn(),
    setTemplateUseCases: jest.fn(),
    templateDescription: "",
    templateExcerpt: "",
    templateName: TEMPLATE_NAME,
    templateUseCases: [],
  };

  const BaseComponentRender = () => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <TemplateInfoForm {...mockProps} />
      </ThemeProvider>
    </Provider>
  );

  it("renders TemplateInfoForm correctly", () => {
    render(<BaseComponentRender />);
    expect(
      screen.getByTestId("t--community-template-name-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--community-template-description-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--community-template-excerpt-input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--community-template-usecases-input"),
    ).toBeInTheDocument();
  });

  it("sets the default title input value", () => {
    render(<BaseComponentRender />);
    const input = screen.getByTestId("t--community-template-name-input");

    expect(input).toHaveValue(TEMPLATE_NAME);
  });

  it("renders the placeholders correctly", () => {
    render(<BaseComponentRender />);
    const excerpt = screen.getByTestId("t--community-template-excerpt-input");
    const description = screen.getByTestId(
      "t--community-template-description-input",
    );
    const useCasesSelectPlaceholderString = screen.getByText(
      "Please select an option",
    );

    expect(excerpt).toHaveAttribute(
      "placeholder",
      createMessage(
        COMMUNITY_TEMPLATES.publishFormPage.templateForm
          .excerptInputPlaceholder,
      ),
    );
    expect(description).toHaveAttribute(
      "placeholder",
      createMessage(
        COMMUNITY_TEMPLATES.publishFormPage.templateForm
          .descriptionInputPlaceholder,
      ),
    );
    expect(useCasesSelectPlaceholderString).toBeInTheDocument();
  });

  it("calls setTemplateName when input value changes", () => {
    render(<BaseComponentRender />);
    const input = screen.getByTestId("t--community-template-name-input");

    fireEvent.change(input, { target: { value: "New Template Name" } });
    expect(mockProps.setTemplateName).toHaveBeenCalledWith("New Template Name");
  });

  it("calls setTemplateExcerpt when input value changes", () => {
    render(<BaseComponentRender />);
    const input = screen.getByTestId("t--community-template-excerpt-input");

    fireEvent.change(input, { target: { value: "New Template Excerpt" } });
    expect(mockProps.setTemplateExcerpt).toHaveBeenCalledWith(
      "New Template Excerpt",
    );
  });

  it("calls setTemplateDescription when input value changes", () => {
    render(<BaseComponentRender />);
    const input = screen.getByTestId("t--community-template-description-input");

    fireEvent.change(input, { target: { value: "New Template Description" } });
    expect(mockProps.setTemplateDescription).toHaveBeenCalledWith(
      "New Template Description",
    );
  });

  it("calls setTemplateUseCases when input value changes", () => {
    render(<BaseComponentRender />);
    const select = screen.getByTestId("t--community-template-usecases-input");
    const input = select.querySelector("input");

    if (input) {
      fireEvent.change(input, {
        target: { value: "Cas" },
      });
      const option = screen.getByText("Case1");

      fireEvent.click(option);
      expect(mockProps.setTemplateUseCases).toHaveBeenCalled();
    }
  });
});
