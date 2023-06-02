const dsl = require("../../../../../fixtures/listRegression2Dsl.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Binding the list widget with text widget", function () {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate text widget data based on changes in list widget Data2", function () {
    _.deployMode.DeployApp();
    cy.wait(5000);
    cy.get(".t--widget-textwidget span:contains('pawan,Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--widget-textwidget span:contains('Ashok,rahul')").should(
      "have.length",
      1,
    );
    _.deployMode.NavigateBacktoEditor();
    cy.get(".t--text-widget-container:contains('pawan,Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--text-widget-container:contains('Ashok,rahul')").should(
      "have.length",
      1,
    );
  });
});
