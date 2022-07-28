import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { HighlightText } from "./HighlightText";
import "jest-styled-components";
import { Colors } from "constants/Colors";

function renderComponent(props: { highlight?: string; text?: string }) {
  const { highlight = "", text = "" } = props;
  return render(<HighlightText highlight={highlight} text={text} />);
}

describe("Highlight Text", () => {
  it("should have default value for highlight and text", () => {
    renderComponent({});
    const comp = screen.getByTestId("t--no-highlight");
    expect(comp).toHaveTextContent("");
  });
  it("shouldn't highlight anything when there is no highlight", () => {
    renderComponent({ text: "test" });
    const comp = screen.getByTestId("t--no-highlight");
    const highlight = screen.queryAllByTestId("t--highlighted-text");
    expect(comp).toHaveTextContent("test");
    expect(highlight).toHaveLength(0);
  });
  it("should highlight parts of the text when there is a highlight", async () => {
    renderComponent({
      highlight: "app",
      text: "appsmith",
    });

    const highlighted = await screen.getByTestId("t--highlighted-text");
    const remainingText = await screen.getByTestId("t--non-highlighted-text");

    expect(highlighted).toBeTruthy();
    expect(remainingText).toBeTruthy();

    expect(highlighted).toHaveTextContent("app");
    expect(remainingText).toHaveTextContent("smith");

    expect(highlighted).toHaveStyleRule("background", `${Colors.FOCUS}`);
  });
});
