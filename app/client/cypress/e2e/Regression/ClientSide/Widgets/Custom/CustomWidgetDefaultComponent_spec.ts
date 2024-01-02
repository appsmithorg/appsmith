import {
  agHelper,
  deployMode,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Custom widget Tests",
  { tags: ["@tag.Widget", "@tag.Custom"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("customwidget", 550, 100);
      cy.wait(5000);
    });

    const getIframeBody = () => {
      // get the iframe > document > body
      // and retry until the body element is not empty
      return (
        cy
          .get(".t--widget-customwidget iframe")
          .its("0.contentDocument.body")
          .should("not.be.empty")
          // wraps "body" DOM element to allow
          // chaining more Cypress commands, like ".find(...)"
          // https://on.cypress.io/wrap
          .then(cy.wrap)
      );
    };

    it("should check that custom widget default component loaded and working properly", () => {
      getIframeBody().find(".tip-container").should("exist");
      getIframeBody()
        .find(".tip-container p")
        .should(
          "have.text",
          "Pass data to this widget in the default model field",
        );

      getIframeBody().find("button.primary").trigger("click");

      getIframeBody()
        .find(".tip-container p")
        .should(
          "have.text",
          "Access data in the javascript file using the appsmith.model variable",
        );

      getIframeBody().find("button.reset").trigger("click");

      agHelper.ValidateToastMessage("Successfully reset!!");
    });

    it("should check that custom widget default component loaded and working properly in published mode", () => {
      deployMode.DeployApp();

      getIframeBody().find(".tip-container").should("exist");
      getIframeBody()
        .find(".tip-container p")
        .should(
          "have.text",
          "Pass data to this widget in the default model field",
        );

      getIframeBody().find("button.primary").trigger("click");

      getIframeBody()
        .find(".tip-container p")
        .should(
          "have.text",
          "Access data in the javascript file using the appsmith.model variable",
        );

      getIframeBody().find("button.reset").trigger("click");

      agHelper.ValidateToastMessage("Successfully reset!!");
    });
  },
);
