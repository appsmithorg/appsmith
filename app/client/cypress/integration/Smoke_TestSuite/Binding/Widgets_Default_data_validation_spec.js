const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/MultipleWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(testdata.command)
      .type(testdata.defaultInputWidget);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Dropdown widget test with default value from table widget", function() {
    cy.openPropertyPane("dropdownwidget");
    /*
    There is bug for multi-select hence commenting out this section
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(commonlocators.dropdownbuttonclick)
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Multi Select")
      .click();
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(commonlocators.menuSelection)
      .should("have.text", "Multi Select");
      */
    cy.testJsontext("options", JSON.stringify(testdata.deafultDropDownWidget));
    cy.get(widgetsPage.defaultOption)
      .type(testdata.command)
      .type(testdata.defaultDropDownValue);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it.skip("RichText widget test with default value from table widget", function() {
    cy.openPropertyPane("richtexteditorwidget");
    cy.testJsontext("defaulttext", testdata.defaultRichtextWidget);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of default data displayed in all widgets based on row selected", function() {
    cy.PublishtheApp();
    cy.isSelectRow(2);
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);

      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });
    /*
As we are seeing intermittent issues in loading we are commenting 
this section untill its fixed
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.validateHTMLText(publish.richTextEditorWidget, "p", tabValue);
    });
*/
    cy.readTabledataPublish("1", "1").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("lindsay.ferguson@reqres.in");
      cy.log("the value is" + tabValue);
      cy.get(widgetsPage.defaultSingleSelectValue)
        .invoke("text")
        .then(text => {
          const someText = text;
          expect(someText).to.equal(tabValue);
        });
    });
  });
});
