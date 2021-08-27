const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/publishWidgetspage.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");

describe("Undo/Redo functionality", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("checks undo/redo for toggle control in property pane", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(`${widgetsPage.disable} label`).should("not.have.class", "checked");
    cy.get(widgetLocators.checkboxWidget + " " + "input").should(
      "not.be.disabled",
    );

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(`${widgetsPage.disable} label`).should("have.class", "checked");
    cy.get(widgetLocators.checkboxWidget + " " + "input").should("be.disabled");
  });

  it("checks undo/redo for input control in property pane", function() {
    cy.get(widgetsPage.inputLabelControl).type("1");
    cy.get(widgetsPage.inputLabelControl).contains("Label1");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.inputLabelControl).contains("Label");
    cy.get(`${publish.checkboxWidget} label`).should("have.text", "Label");

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(widgetsPage.inputLabelControl).contains("Label1");
    cy.get(`${publish.checkboxWidget} label`).should("have.text", "Label1");
  });

  it("checks undo/redo for deletion of widgets", function() {
    cy.deleteWidget(widgetsPage.checkboxWidget);
    cy.get(widgetsPage.buttonWidget).should("not.exist");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.checkboxWidget).should("exist");

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(widgetsPage.buttonWidget).should("not.exist");
  });
});
