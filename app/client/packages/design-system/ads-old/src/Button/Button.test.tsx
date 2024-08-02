import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Button, { Size } from "./index";
import { create } from "react-test-renderer";

describe("<Button /> component - render", () => {
  it("renders the button component with text passed as input", () => {
    render(<Button size={Size.medium} tag="button" text="Run" />);
    expect(screen.getByRole("button")).toHaveTextContent("Run");
  });
});

describe("<Button /> component - loading behaviour", () => {
  it("calls the onclick handler when not in loading state", () => {
    const fn = jest.fn();
    const tree = create(
      <Button
        isLoading={false}
        onClick={fn}
        size={Size.medium}
        tag="button"
        text="Run"
      />,
    );
    const button = tree.root.findByType("button");
    button.props.onClick();
    expect(fn.mock.calls.length).toBe(1);
  });

  it("does not call the onclick handler when in loading state", () => {
    const fn = jest.fn();
    const tree = create(
      <Button
        isLoading
        onClick={fn}
        size={Size.medium}
        tag="button"
        text="Run"
      />,
    );
    const button = tree.root.findByType("button");
    button.props.onClick();
    expect(fn.mock.calls.length).toBe(0);
  });
});
