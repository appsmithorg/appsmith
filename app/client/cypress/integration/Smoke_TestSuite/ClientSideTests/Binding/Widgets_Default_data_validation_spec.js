const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/MultipleWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.wait(3000);
    cy.openPropertyPane("inputwidget");
    cy.testJsontext("defaulttext", testdata.defaultInputWidget + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  //To be enabled once the single select multi select issues are resolved
  it("Dropdown widget test with default value from table widget", function() {
    cy.isSelectRow(1);
    cy.openPropertyPane("dropdownwidget");
    cy.testJsontext("options", JSON.stringify(testdata.deafultDropDownWidget));
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("lindsay.ferguson@reqres.in")
      .click({ force: true });
    // Verify the selected value
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.defaultSingleSelectValue)
      .should("have.text", "lindsay.ferguson@reqres.in");
  });

  it("validation of default data displayed in all widgets based on row selected", function() {
    cy.isSelectRow(2);
    cy.readTabledataPublish("2", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("6788734");
      cy.log("the value is" + tabValue);

      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });

    cy.readTabledataPublish("2", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("tobias.funke@reqres.in");
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
});
