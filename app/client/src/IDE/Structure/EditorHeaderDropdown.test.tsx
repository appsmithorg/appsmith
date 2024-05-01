import React from "react";
import { render } from "@testing-library/react";
import EditorHeaderDropdown from "./EditorHeaderDropdown";
import "@testing-library/jest-dom";

describe("EditorHeaderDropdown", () => {
  it("renders children components correctly", () => {
    const { getByText } = render(
      <EditorHeaderDropdown>
        <EditorHeaderDropdown.Header>
          <span>Header</span>
        </EditorHeaderDropdown.Header>
        <EditorHeaderDropdown.Body>
          <span>Body</span>
        </EditorHeaderDropdown.Body>
      </EditorHeaderDropdown>,
    );

    expect(getByText("Header")).toBeInTheDocument();
    expect(getByText("Body")).toBeInTheDocument();
  });

  it("applies custom className to the header", () => {
    const customClass = "my-custom-class";
    const { container } = render(
      <EditorHeaderDropdown>
        <EditorHeaderDropdown.Header className={customClass}>
          <span>Header</span>
        </EditorHeaderDropdown.Header>
        <EditorHeaderDropdown.Body>
          <span>Body</span>
        </EditorHeaderDropdown.Body>
      </EditorHeaderDropdown>,
    );

    const headerElement = container.querySelector(`.${customClass}`);
    expect(headerElement).toBeInTheDocument();
  });
});
