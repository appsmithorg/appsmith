import React from "react";
import { NotificationBanner, NotificationVariant } from "./NotificationBanner";
import { render, screen } from "test/testUtils";
import "jest-styled-components";

describe("NotificationBanner", function() {
  it("error variant is rendered properly", async () => {
    const el = (
      <NotificationBanner
        className={"test-error error"}
        variant={NotificationVariant.error}
      />
    );
    expect(el).toEqual(
      <NotificationBanner className="test-error error" variant={0} />,
    );
    render(el);

    const rendered = await screen.getByTestId("t--notification-banner");
    expect(rendered).not.toBeNull();
    expect(rendered?.classList).toContain("test-error");
  });

  it("error variant renders with correct style", async () => {
    const el = (
      <NotificationBanner
        className={"test-error error"}
        variant={NotificationVariant.error}
      />
    );
    render(el);

    const rendered = await screen.getByTestId("t--notification-banner");

    const expectedStyles = {
      display: "flex",
      "flex-direction": "row",
      "align-items": "center",
      flex: "1",
      padding: "8px",
      position: "relative",
      "max-width": "486px",
      width: "100%",
      "min-height": "56px",
      // "background-color": "#FFE9E9",
      // color: "#C91818",
    };
    expect(rendered).toHaveStyleRule("display", expectedStyles["display"]);
    expect(rendered).toHaveStyleRule(
      "flex-direction",
      expectedStyles["flex-direction"],
    );
    expect(rendered).toHaveStyleRule(
      "align-items",
      expectedStyles["align-items"],
    );
    expect(rendered).toHaveStyleRule("flex", expectedStyles["flex"]);
    expect(rendered).toHaveStyleRule("padding", expectedStyles["padding"]);
    expect(rendered).toHaveStyleRule("position", expectedStyles["position"]);
    expect(rendered).toHaveStyleRule("max-width", expectedStyles["max-width"]);
    expect(rendered).toHaveStyleRule("width", expectedStyles["width"]);
    expect(rendered).toHaveStyleRule(
      "min-height",
      expectedStyles["min-height"],
    );
    // expect(rendered).toHaveStyleRule(
    //   "background-color",
    //   expectedStyles["background-color"],
    // );
    // expect(rendered).toHaveStyleRule("color", expectedStyles["color"]);
  });
});
