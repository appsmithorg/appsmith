const dsl = require("../../../../fixtures/formInputTableDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the multiple input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");

    cy.wait(2000);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("2. Validation of data displayed in all widgets based on row selected", function() {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);

      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
      //       cy.get(publish.inputWidget + " " + "input")
      //         .last()
      //         .invoke("attr", "value")
      //         .should("contain", tabValue);
    });
  });
});
