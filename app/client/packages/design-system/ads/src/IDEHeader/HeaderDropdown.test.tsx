import React from "react";
import { render, screen } from "@testing-library/react";
import { IDEHeaderDropdown } from "./HeaderDropdown";
import "@testing-library/jest-dom";

describe("HeaderDropdown", () => {
  it("renders children components correctly", () => {
    render(
      <IDEHeaderDropdown>
        <IDEHeaderDropdown.Header>
          <span>Header</span>
        </IDEHeaderDropdown.Header>
        <IDEHeaderDropdown.Body>
          <span>Body</span>
        </IDEHeaderDropdown.Body>
      </IDEHeaderDropdown>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("applies custom className to the header", () => {
    const customClass = "my-custom-class";
    const { container } = render(
      <IDEHeaderDropdown>
        <IDEHeaderDropdown.Header className={customClass}>
          <span>Header</span>
        </IDEHeaderDropdown.Header>
        <IDEHeaderDropdown.Body>
          <span>Body</span>
        </IDEHeaderDropdown.Body>
      </IDEHeaderDropdown>,
    );

    // eslint-disable-next-line testing-library/no-node-access,testing-library/no-container
    const headerElement = container.querySelector(`.${customClass}`);

    expect(headerElement).toBeInTheDocument();
  });
});
