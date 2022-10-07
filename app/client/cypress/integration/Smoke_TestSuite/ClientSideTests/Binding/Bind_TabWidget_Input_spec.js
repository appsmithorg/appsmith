const dsl = require("../../../../fixtures/tabInputDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the input Widget with tab Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from tab widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.testJsontext("defaultvalue", testdata.tabBinding + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of data displayed in input widgets based on tab selected", function() {
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 2")
      .click()
      .wait(1000)
      .should("have.class", "is-selected");
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "Tab 2");
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .click()
      .wait(1000)
      .should("have.class", "is-selected");
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "Tab 1");
  });
});
