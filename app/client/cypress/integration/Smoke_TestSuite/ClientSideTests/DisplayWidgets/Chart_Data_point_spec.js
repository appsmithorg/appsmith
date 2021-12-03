/* eslint-disable cypress/no-unnecessary-waiting */
const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/ChartDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Chart Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from chart datapoint", function() {
    cy.SearchEntityandOpen("Input1");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.testJsontext("defaulttext", testdata.bindChartData + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Chart with datapoint feature validation", function() {
    cy.SearchEntityandOpen("Chart1");
    cy.addAction(testdata.bindingDataPoint);
    cy.closePropertyPane();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.xpath("(//*[local-name()='rect'])[13]")
      .first()
      .click({ force: true });
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .then(($value) => {
        const text = $value;
        cy.log(text);
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(3000);
        cy.get(".t--toast-action span")
          .first()
          .invoke("text")
          .then((text) => {
            const toasttext = text;
            cy.log(toasttext);
            expect(text.trim()).to.equal(toasttext.trim());
          });
      });
  });

  it("Chart with seriesTitle feature validation", function() {
    cy.SearchEntityandOpen("Input2");
    cy.get(widgetsPage.defaultInput).type(testdata.bindingSeriesTitle);

    cy.get(publish.inputWidget + " " + "input")
      .last()
      .should("have.value", dsl.dsl.children[0].chartData[0].seriesName);
  });
});
