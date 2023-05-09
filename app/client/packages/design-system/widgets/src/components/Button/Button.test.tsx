import React from "react";
import "@testing-library/jest-dom";
import { Icon } from "@design-system/headless";
import { render, screen } from "@testing-library/react";
import EmotionHappyLineIcon from "remixicon-react/EmotionHappyLineIcon";

import { Button } from "./";

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
    render(<Button variant="primary" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-variant",
      "primary",
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
    const { container } = render(
      <Button
        icon={
          <Icon>
            <EmotionHappyLineIcon />
          </Icon>
        }
      />,
    );

    const icon = container.querySelector("button [data-icon]") as HTMLElement;
    expect(icon).toBeInTheDocument();
  });

  it("sets icon position attribute based on the prop ", () => {
    const { container } = render(<Button iconPosition="end" />);

    const button = container.querySelector("button") as HTMLElement;
    expect(button).toHaveAttribute("data-icon-position", "end");

    const styles = window.getComputedStyle(button);
    expect(styles.flexDirection).toBe("row-reverse");
  });
});
