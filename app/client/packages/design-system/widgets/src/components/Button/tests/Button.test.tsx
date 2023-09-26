import React from "react";
import "@testing-library/jest-dom";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";

import { Button } from "../";

// Adapted from remixicon-react/EmotionHappyLineIcon (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/User%20%26%20Faces/emotion-happy-line.svg)
const EmotionHappyLineIcon = ({ ...props }: ComponentProps<"svg">) => {
  return (
    <svg
      fill="currentColor"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-5-7h2a3 3 0 1 0 6 0h2a5 5 0 0 1-10 0Zm1-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
};

describe("@design-system/widgets/Button", () => {
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

    const icon = screen.getByRole("button").querySelector("[data-icon]");
    expect(icon).toBeInTheDocument();
  });

  it("renders icon when passed", () => {
    const { container } = render(<Button icon={EmotionHappyLineIcon} />);

    const icon = container.querySelector("button [data-icon]") as HTMLElement;
    expect(icon).toBeInTheDocument();
  });

  it("sets icon position attribute based on the prop ", () => {
    render(<Button iconPosition="end" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-icon-position", "end");
  });
});
