const dsl = require("../../../../fixtures/Select_table_dsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("validation of  default displayed in select widget based on row selected", function() {
    cy.isSelectRow(0);
    cy.readTabledataPublish("0", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("#1");
      cy.log("the value is" + tabValue);
      cy.get(widgetsPage.defaultSingleSelectValue)
        .first()
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(tabValue);
        });
    });
  });
  it("validation of  data displayed in select widget based on row selected", function() {
    cy.isSelectRow(2);
    cy.get(widgetsPage.defaultSingleSelectValue)
      .first()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("#3");
      });
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("#1")
      .click({ force: true });
    cy.get(commonlocators.TextInside).contains("#1");
  });
});
