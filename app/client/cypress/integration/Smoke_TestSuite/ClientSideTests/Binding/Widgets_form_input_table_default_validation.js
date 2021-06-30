const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/formInputTableDsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the multiple input Widget", function() {
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

  it("validation of data displayed in all widgets based on row selected", function() {
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
