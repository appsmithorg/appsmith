const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/MultipleWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultInputWidget);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Dropdown widget test with default value from table widget", function() {
    cy.openPropertyPane("dropdownwidget");
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
    cy.testJsontext("options", JSON.stringify(this.data.deafultDropDownWidget));
    cy.get(widgetsPage.defaultOption)
      .type(this.data.command)
      .type(this.data.defaultDropDownValue);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("RichText widget test with default value from table widget", function() {
    cy.openPropertyPane("richtexteditorwidget");
    cy.testJsontext("defaulttext", this.data.defaultRichtextWidget);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of default data displayed in all widgets based on row selected", function() {
    cy.PublishtheApp();
    cy.wait(2000);
    cy.isSelectRow(2);
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);
      cy.get(".bp3-input-group input")
        .first()
        .should("have.value", tabValue);
    });

    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.validateHTMLText(publish.richTextEditorWidget, "p", tabValue);
    });

    cy.readTabledataPublish("1", "1").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("lindsay.ferguson@reqres.in");
      cy.log("the value is" + tabValue);
      cy.get(".bp3-tag-input-values input").should("have.value", tabValue);
    });
  });
});
