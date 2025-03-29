import {
  agHelper,
  autoLayout,
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Custom widget Tests",
  { tags: ["@tag.Widget", "@tag.excludeForAirgap", "@tag.Binding"] },
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
        .find(".tip-container .content")
        .should(
          "have.text",
          "Pass data to this widget in the default model field",
        );

      getIframeBody().find("button.primary").trigger("click");

      getIframeBody()
        .find(".tip-container .content")
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
        .find(".tip-container .content")
        .should(
          "have.text",
          "Pass data to this widget in the default model field",
        );

      getIframeBody().find("button.primary").trigger("click");

      getIframeBody()
        .find(".tip-container .content")
        .should(
          "have.text",
          "Access data in the javascript file using the appsmith.model variable",
        );

      getIframeBody().find("button.reset").trigger("click");

      agHelper.ValidateToastMessage("Successfully reset!!");

      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("Custom1", EntityType.Widget);

      propPane.DeleteWidgetFromPropertyPane("Custom1");
    });

    it("#31170 - should check that custom widget height is not growing constantly in auto layout", () => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);

      entityExplorer.DragDropWidgetNVerify("customwidget", 550, 100);

      agHelper
        .GetNClick(".t--widget-customwidget iframe")
        .invoke("height")
        .then((height) => {
          cy.wrap(height).as("height");
        });

      agHelper.Sleep(2000);

      cy.get("@height").then((height) => {
        agHelper.AssertHeight(
          ".t--widget-customwidget iframe",
          height as unknown as number,
        );
      });
    });
  },
);
