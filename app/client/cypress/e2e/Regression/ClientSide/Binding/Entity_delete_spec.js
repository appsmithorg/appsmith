const widgetsPage = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.fixture("SimpleBinding").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Checks if delete will remove bindings", function () {
    cy.get(widgetsPage.textWidget).first().click({ force: true });
    cy.get("body").type("{del}", { force: true });

    cy.get(widgetsPage.textWidget).first().should("not.have.text", "Label");
  });
});
