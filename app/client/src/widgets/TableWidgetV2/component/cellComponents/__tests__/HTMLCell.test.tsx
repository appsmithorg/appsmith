import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { CompactModeTypes } from "../../Constants";
import HTMLCell, { type HTMLCellProps } from "../HTMLCell";

const mockStore = configureStore([]);

const defaultProps: HTMLCellProps = {
  value: "<p>Hello World</p>",
  cellBackground: "",
  compactMode: CompactModeTypes.DEFAULT,
  fontStyle: "",
  horizontalAlignment: "LEFT",
  isCellDisabled: false,
  isCellVisible: true,
  isHidden: false,
  textColor: "",
  textSize: "0.875rem",
  verticalAlignment: "CENTER",
  allowCellWrapping: false,
  renderMode: "CANVAS",
};

const renderComponent = (
  props: Partial<HTMLCellProps> = {},
  store = unitTestBaseMockStore,
) => {
  return render(
    <Provider store={mockStore(store)}>
      <ThemeProvider theme={lightTheme}>
        <HTMLCell {...defaultProps} {...props} />
      </ThemeProvider>
    </Provider>,
  );
};

describe("HTMLCell", () => {
  describe("renders HTML content correctly", () => {
    it("with data-testid", () => {
      renderComponent({
        value: '<p data-testid="html-content">Hello World</p>',
      });

      expect(screen.getByTestId("html-content")).toBeInTheDocument();
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("renders complex HTML with lists correctly", () => {
      const complexHTML = `
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    `;

      renderComponent({ value: complexHTML });
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("renders links with correct styling", () => {
      const htmlWithLink =
        '<a target="_blank" href="https://example.com">Click me</a>';

      renderComponent({ value: htmlWithLink });
      const link = screen.getByText("Click me");

      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("handles number values correctly", () => {
      renderComponent({ value: "123" });
      expect(screen.getByText("123")).toBeInTheDocument();
    });
  });

  describe("handles null/undefined values", () => {
    it("handles null/undefined values", () => {
      renderComponent({ value: undefined });
      const htmlCell = screen.getByTestId("t--table-widget-v2-html-cell");
      const span = htmlCell.querySelector("span");

      expect(span).toBeInTheDocument();
      expect(span).toBeEmptyDOMElement();
    });

    it("handles null values", () => {
      renderComponent({ value: null as unknown as string });
      const span = screen
        .getByTestId("t--table-widget-v2-html-cell")
        .querySelector("span");

      expect(span).toBeInTheDocument();
      expect(span).toBeEmptyDOMElement();
    });
  });

  describe("HTML Sanitization", () => {
    it("should allow safe HTML", () => {
      const input = "<b>Bold Text</b>";

      renderComponent({ value: input });
      expect(screen.getByText("Bold Text")).toBeInTheDocument();
    });

    it("should block <script> tags", () => {
      renderComponent({ value: "<script>alert('XSS')</script>" });
      const htmlCell = screen.getByTestId("t--table-widget-v2-html-cell");

      expect(htmlCell.querySelector("script")).not.toBeInTheDocument();
    });

    it("should block unsafe attributes like onclick", () => {
      renderComponent({
        value: `<div onclick="alert('hack')">Click me</div>
        <button onclick="alert('hack')">Click me</button>`,
      });
      const htmlCell = screen.getByTestId("t--table-widget-v2-html-cell");

      expect(htmlCell.querySelector("div")).not.toHaveAttribute("onclick");
      expect(htmlCell.querySelector("button")).not.toHaveAttribute("onclick");
    });

    it("should handle invalid HTML gracefully", () => {
      renderComponent({ value: "<div><b>Unclosed tag" });
      const htmlCell = screen.getByTestId("t--table-widget-v2-html-cell");

      expect(htmlCell.querySelector("div")).toHaveTextContent("Unclosed tag");
    });
  });
});
