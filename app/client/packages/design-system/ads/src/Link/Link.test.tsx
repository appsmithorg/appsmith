import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Link } from "./Link";
import { StaticRouter } from "react-router-dom";
import { LinkClassName } from "./Link.constants";

describe("Link component", () => {
  it("renders internal link correctly", () => {
    const { getByTestId } = render(
      <StaticRouter>
        <Link data-testid={LinkClassName} to="/old">
          Internal Link
        </Link>
      </StaticRouter>,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const link = getByTestId(LinkClassName);
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/old");
  });

  it("renders external link correctly", () => {
    const { getByTestId } = render(
      <Link data-testid={LinkClassName} to="https://appsmith.com">
        External Link
      </Link>,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const link = getByTestId(LinkClassName);
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("https://appsmith.com");
  });

  it("calls onClick handler correctly", () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <StaticRouter>
        <Link data-testid={LinkClassName} onClick={onClickMock} to="/internal">
          Clickable Link
        </Link>
      </StaticRouter>,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const link = getByTestId(LinkClassName);

    fireEvent.click(link);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
