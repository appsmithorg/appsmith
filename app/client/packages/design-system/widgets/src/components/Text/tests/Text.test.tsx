import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Text } from "../";

describe("@design-system/widgets/Text", () => {
  it("should render the text", () => {
    render(<Text>My Text</Text>);

    expect(screen.getByText("My Text")).toBeInTheDocument();
  });

  it("should support custom props", () => {
    const { container } = render(<Text data-testid="text">My Text</Text>);

    const text = container.querySelector("div") as HTMLElement;
    expect(text).toHaveAttribute("data-testid", "text");
  });
});
