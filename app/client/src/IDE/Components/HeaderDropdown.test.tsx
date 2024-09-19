import React from "react";
import { render } from "@testing-library/react";
import HeaderDropdown from "./HeaderDropdown";
import "@testing-library/jest-dom";

describe("HeaderDropdown", () => {
  it("renders children components correctly", () => {
    const { getByText } = render(
      <HeaderDropdown>
        <HeaderDropdown.Header>
          <span>Header</span>
        </HeaderDropdown.Header>
        <HeaderDropdown.Body>
          <span>Body</span>
        </HeaderDropdown.Body>
      </HeaderDropdown>,
    );

    expect(getByText("Header")).toBeInTheDocument();
    expect(getByText("Body")).toBeInTheDocument();
  });

  it("applies custom className to the header", () => {
    const customClass = "my-custom-class";
    const { container } = render(
      <HeaderDropdown>
        <HeaderDropdown.Header className={customClass}>
          <span>Header</span>
        </HeaderDropdown.Header>
        <HeaderDropdown.Body>
          <span>Body</span>
        </HeaderDropdown.Body>
      </HeaderDropdown>,
    );

    const headerElement = container.querySelector(`.${customClass}`);

    expect(headerElement).toBeInTheDocument();
  });
});
