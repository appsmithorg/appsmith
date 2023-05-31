import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Help Button on editor", function () {
  it("1. Chat with us and Intercom consent should be visible on Help Menu", () => {
    _.agHelper.GetNClick("[data-testid='t--help-button']", 0, true, 1000);
    _.agHelper.GetNClick("#intercom-trigger", 0, true, 1000);
    _.agHelper.GetNAssertElementText(
      "[data-testid='t--intercom-consent-text']",
      "Can we have your email for better support?",
      "contain.text",
    );
  });
});
