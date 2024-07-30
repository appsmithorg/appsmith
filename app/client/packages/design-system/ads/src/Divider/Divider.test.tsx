import React from "react";
import { render } from "@testing-library/react";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders", () => {
    const { getByTestId } = render(<Divider data-testid="divider" />);
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const divider = getByTestId("divider");
    expect(divider).toBeInTheDocument();
  });

  it("is horizontal by default", () => {
    const { getByTestId } = render(<Divider data-testid="divider" />);
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const divider = getByTestId("divider");
    expect(divider).toHaveAttribute("orientation", "horizontal");
  });

  it("is vertical when set explicitly", () => {
    const { getByTestId } = render(
      <Divider data-testid="divider" orientation="vertical" />,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const divider = getByTestId("divider");
    expect(divider).not.toHaveAttribute("orientation", "horizontal");
    expect(divider).toHaveAttribute("orientation", "vertical");
  });
});
