const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/inputBindingdsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("aTob and bToa library tests ", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value for atob method", function() {
    cy.SearchEntityandOpen("Input1");
    cy.testJsontext("defaulttext", testdata.atobInput + "}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Input widget test with default value for btoa method", function() {
    cy.SearchEntityandOpen("Input2");
    cy.testJsontext("defaulttext", testdata.btoaInput + "}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("publish widget and validate the data displayed in input widgets value for aToB and bToa", function() {
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "A");
    cy.get(publish.inputWidget + " " + "input")
      .last()
      .invoke("attr", "value")
      .should("contain", "QQ==");
  });
});
