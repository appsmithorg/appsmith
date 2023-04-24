import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage, locators } = _;

describe("this.params in IIFE function in API editor", () => {
  it("1. this.params should be available in IIFE function in API editor", () => {
    apiPage.CreateApi("Api1", "GET");

    _.agHelper.GetNClick(_.locators._paramsTab);
    cy.get(locators._queryParamsKey(0)).then(($el) => {
      agHelper.UpdateCodeInput($el, "page");
    });

    cy.get(locators._queryParamsValue(0)).then(($el) => {
      agHelper.UpdateCodeInput(
        $el,
        "{{(function () { return this.params.key; })()}}",
      );
    });

    agHelper.VerifyEvaluatedValue("page");
  });
});
