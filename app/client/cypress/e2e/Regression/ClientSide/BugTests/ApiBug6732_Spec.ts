import * as _ from "../../../../support/Objects/ObjectsCore";

const { apiPage } = _;

describe(
  "Bug 6732 - this.params in IIFE function in API editor",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. this.params should be available in IIFE function in API editor", () => {
      apiPage.CreateApi("Api1", "GET");

      apiPage.SelectPaneTab("Params");
      apiPage.EnterParams(
        "page",
        "{{(function () { return this.params.key; })()}}",
        0,
        false,
      );

      cy.get(apiPage._paramValue(0)).should(
        "not.have.class",
        "t--codemirror-has-error",
      );
    });
  },
);
