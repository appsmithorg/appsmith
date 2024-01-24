import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Help Button on editor", function () {
  it(
    "1. Chat with us and Intercom consent should be visible on Help Menu",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      _.agHelper.GetNClick(
        _.debuggerHelper.locators._helpButton,
        0,
        true,
        1000,
      );
      _.agHelper.GetNClick(
        _.debuggerHelper.locators._intercomOption,
        0,
        true,
        1000,
      );
      _.agHelper.GetNAssertElementText(
        _.debuggerHelper.locators._intercomConsentText,
        "Can we have your email for better support?",
        "contain.text",
      );
    },
  );
});
