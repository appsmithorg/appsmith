const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/MultipleInput.json");
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

  it("1. Cyclic depedancy error message validation", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaulttext", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastmsg).contains("Cyclic dependency");
  });

  it("2. Binding input widget1 and validating", function() {
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

  it("3. Binding second input widget with first input widget and validating", function() {
    cy.selectEntityByName("Input2");
    cy.testJsontext("defaulttext", testdata.defaultMoustacheData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.xpath(testdata.input2)
      .invoke("attr", "value")
      .should("contain", testdata.defaultdata);
    cy.get(publish.backToEditor).click();
  });

  it("4. Binding third input widget with first input widget and validating", function() {
    cy.CheckAndUnfoldWidgets();
    cy.selectEntityByName("Input3");
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
