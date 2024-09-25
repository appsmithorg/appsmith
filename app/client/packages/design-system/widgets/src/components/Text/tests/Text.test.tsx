import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Text } from "../";

describe("@appsmith/wds/Text", () => {
  it("should render the text", () => {
    render(<Text>My Text</Text>);

    expect(screen.getByText("My Text")).toBeInTheDocument();
  });

  it("should support custom props", () => {
    const { container } = render(<Text data-testid="t--text">My Text</Text>);

    // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
    const text = container.querySelector("div") as HTMLElement;

    expect(text).toHaveAttribute("data-testid", "t--text");
  });
});
