import React from "react";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders", () => {
    render(<Badge data-testid="t--badge" />);
    const badge = screen.getByTestId("t--badge");

    expect(badge).toBeInTheDocument();
  });
});
