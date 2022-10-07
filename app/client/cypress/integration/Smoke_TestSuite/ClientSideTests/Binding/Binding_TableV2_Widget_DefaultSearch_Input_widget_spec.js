const dsl = require("../../../../fixtures/formInputTableV2Dsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the Table and input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("2. validation of data displayed in input widgets based on search value set", function() {
    cy.SearchEntityandOpen("Table1");
    cy.get(".t--property-control-allowsearching input").click({ force: true });
    cy.testJsontext("defaultsearchtext", "2736212");
    cy.wait("@updateLayout").isSelectRow(0);
    cy.readTableV2dataPublish("0", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });
  });
});
