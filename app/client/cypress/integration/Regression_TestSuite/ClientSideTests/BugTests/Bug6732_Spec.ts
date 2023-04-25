import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage } = _;

describe("this.params in IIFE function in API editor", () => {
  it("1. this.params should be available in IIFE function in API editor", () => {
    apiPage.CreateApi("Api1", "GET");

    apiPage.SelectPaneTab("Params");
    apiPage.EnterParams(
      "page",
      "{{(function () { return this.params.key; })()}}",
      0,
      false,
    );

    agHelper.VerifyEvaluatedValue("page");
  });
});
