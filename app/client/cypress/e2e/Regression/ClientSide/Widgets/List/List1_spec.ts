import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Binding the list widget with text widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    //const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    it("1. Validate delete widget action from side bar", function () {
      _.agHelper.AddDsl("listRegressionDsl");
      cy.openPropertyPane("listwidget");
      cy.verifyUpdatedWidgetName("Test");
      cy.verifyUpdatedWidgetName("#$%1234", "___1234");
      cy.verifyUpdatedWidgetName("56789");
      cy.get(commonlocators.deleteWidget).click({ force: true });
      cy.get("div.Toastify__toast").eq(0).contains("56789 is removed");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.reload();
      //cy.get(commonlocators.homeIcon).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
    });
  },
);
