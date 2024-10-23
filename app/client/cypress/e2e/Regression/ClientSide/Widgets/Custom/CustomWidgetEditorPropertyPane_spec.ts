import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Custom widget Tests",
  { tags: ["@tag.Widget", "@tag.excludeForAirgap", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("customWidget");
    });

    const getIframeBody = () => {
      // get the iframe > document > body
      // and retry until the body element is not empty
      return cy
        .get(".t--widget-customwidget iframe")
        .its("0.contentDocument")
        .should("exist")
        .its("body")
        .should("not.be.undefined")
        .then(cy.wrap);
    };

    it("shoud check that default model changes are converyed to custom component", () => {
      getIframeBody().find(".tip-container").should("exist");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "");

      getIframeBody().find("button.primary").trigger("click");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "1");

      getIframeBody().find("button.reset").trigger("click");

      agHelper.ValidateToastMessage("Successfully reset from 1");

      agHelper.GetElement(".t--text-widget-container").should("have.text", "0");
    });
  },
);
