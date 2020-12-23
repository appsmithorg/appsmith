const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/formInputTableDsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Binding the Table and input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.defaultInputWidget);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of data displayed in input widgets based on search value set", function() {
    cy.SearchEntityandOpen("Table1");
    cy.get(commonlocators.defaultSearchText)
      .last()
      .type("2736212", { force: true });
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").isSelectRow(0);
    cy.readTabledataPublish("0", "0").then(tabData => {
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
