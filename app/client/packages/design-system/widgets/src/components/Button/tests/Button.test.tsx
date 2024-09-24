import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Button } from "../";

describe("@appsmith/wds/Button", () => {
  it("renders children when passed", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("passes type to button component", () => {
    render(<Button type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("sets variant based on prop", () => {
    render(<Button variant="filled" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "filled",
    );
  });

  it("sets disabled attribute based on prop", () => {
    render(<Button isDisabled />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("data-disabled");
  });

  it("sets data-loading attribute and icon based on loading prop", () => {
    render(<Button isLoading />);
    expect(screen.getByRole("button")).toHaveAttribute("data-loading");

    // eslint-disable-next-line testing-library/no-node-access
    const icon = screen.getByRole("button").querySelector("[data-icon]");

    expect(icon).toBeInTheDocument();
  });

  it("renders icon when passed", () => {
    render(<Button icon="star" />);
    // Note: using testid=t--fallack-icon as the icon is rendered lazily and the fallback component
    // has a testid
    const icon = screen.getByTestId("t--fallback-icon");

    expect(icon).toBeInTheDocument();
  });

  it("sets icon position attribute based on the prop ", () => {
    render(<Button iconPosition="end" />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("data-icon-position", "end");
  });
});
