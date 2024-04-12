import { fireEvent, render, screen } from "@testing-library/react";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { unitTestMockTemplate } from "pages/Templates/test_config";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import Template from "..";
import "@testing-library/jest-dom/extend-expect";
const mockStore = configureStore([]);

describe("TemplateLayoutCard", () => {
  let store: any;

  beforeEach(() => {
    store = mockStore(unitTestBaseMockStore);
  });

  const BaseComponentRender = (component: JSX.Element) => (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>{component}</ThemeProvider>
    </Provider>
  );

  it("renders correctly", () => {
    render(
      BaseComponentRender(
        <Template
          hideForkTemplateButton={false}
          template={unitTestMockTemplate}
        />,
      ),
    );
    const card = screen.getByTestId("template-card");
    expect(card).toBeInTheDocument();
  });

  it("calls onClick & onForkTemplateClick when template card is clicked", () => {
    const mockOnClick = jest.fn();
    const mockOnForkTemplateClick = jest.fn();
    const { getByTestId } = render(
      BaseComponentRender(
        <Template
          hideForkTemplateButton={false}
          onClick={mockOnClick}
          onForkTemplateClick={mockOnForkTemplateClick}
          template={unitTestMockTemplate}
        />,
      ),
    );
    fireEvent.click(getByTestId("template-card"));
    expect(mockOnClick).toHaveBeenCalledWith(unitTestMockTemplate.id);

    fireEvent.click(getByTestId("t--fork-template-button"));
    expect(mockOnForkTemplateClick).toHaveBeenCalledWith(unitTestMockTemplate);
  });
});
