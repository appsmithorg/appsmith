const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/MultipleInput.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the multiple input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  Cypress.on("uncaught:exception", (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false;
  });

  it("Cyclic depedancy error message validation", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaulttext", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastmsg).contains("Cyclic dependency");
  });

  it("Binding input widget1 and validating", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaulttext", testdata.defaultdata);

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
  });

  it("Binding second input widget with first input widget and validating", function() {
    cy.SearchEntityandOpen("Input2");
    cy.testJsontext("defaulttext", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.reload();

    /*
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.get(publish.backToEditor)
      .first()
      .click();
      */
  });

  it("Binding third input widget with first input widget and validating", function() {
    cy.SearchEntityandOpen("Input3");
    cy.testJsontext("defaulttext", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.get(publish.inputWidget + " " + "input")
      .last()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
  });
});
