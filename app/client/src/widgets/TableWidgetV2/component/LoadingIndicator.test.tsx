import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { LoadingIndicator } from "./LoadingIndicator";

describe("LoadingIndicator", () => {
  it("renders a spinner and loading text", () => {
    render(<LoadingIndicator />);

    // Check if the Flex container is rendered
    const flexContainer = document.querySelector(".ads-v2-flex");

    expect(flexContainer).toBeInTheDocument();

    // Check if the spinner is rendered
    const spinner = document.querySelector(".ads-v2-spinner");

    expect(spinner).toBeInTheDocument();

    // Check if the text is displayed correctly
    const textElement = screen.getByText("loading records");

    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveClass("ads-v2-text");
  });
});
