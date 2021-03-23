/// <reference types="Cypress" />

const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/formInputTableDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the table widget and input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.defaultInputWidget);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input2");
    cy.get(widgetsPage.defaultInput).type(testdata.defaultRowIndexBinding);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of data displayed in input widgets based on selected row", function() {
    cy.SearchEntityandOpen("Table1");
    cy.get(commonlocators.deflautSelectedRow)
      .last()
      .type("2", { force: true });
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.readTabledataPublish("2", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("6788734");
      cy.log("the value is" + tabValue);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
      cy.get(publish.inputWidget + " " + "input")
        .last()
        .invoke("attr", "value")
        .should("contain", 2);
    });
  });
});
