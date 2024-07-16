import React from "react";
import { render } from "@testing-library/react";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders", () => {
    const { getByTestId } = render(<Divider data-testid="divider" />);
    const divider = getByTestId("divider");
    expect(divider).toBeInTheDocument();
  });

  it("is horizontal by default", () => {
    const { getByTestId } = render(<Divider data-testid="divider" />);
    const divider = getByTestId("divider");
    expect(divider).toHaveAttribute("orientation", "horizontal");
  });

  it("is vertical when set explicitly", () => {
    const { getByTestId } = render(
      <Divider data-testid="divider" orientation="vertical" />,
    );
    const divider = getByTestId("divider");
    expect(divider).not.toHaveAttribute("orientation", "horizontal");
    expect(divider).toHaveAttribute("orientation", "vertical");
  });
});
