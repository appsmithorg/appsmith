import React from "react";
import "@testing-library/jest-dom";

import { NotificationBanner, NotificationVariant } from "./NotificationBanner";
import { render, screen } from "@testing-library/react";

describe("NotificationBanner", function() {
  it("error variant is rendered properly", () => {
    const el = (
      <NotificationBanner
        className={"test-error"}
        variant={NotificationVariant.error}
      />
    );
    expect(el).toEqual(
      <NotificationBanner className="test-error" variant={0} />,
    );
    render(el);

    const rendered = screen.getByTestId("t--notification-banner");
    expect(rendered).not.toBeNull();
    expect(rendered).toHaveClass("test-error");
  });
});
