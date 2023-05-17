import dsl from "../../../../fixtures/explorerHiddenWidgets.json";
import commonLocators from "../../../../locators/commonlocators.json";
import widgets from "../../../../locators/Widgets.json";
const widgetLocators = require("../../../../locators/Widgets.json");

describe("Explorer hidden widget Selection", () => {
  before(() => {
    cy.addDsl(dsl);
  });
  afterEach(() => {
    cy.get(commonLocators.canvas).click({ force: true });
  });
  it("Opens modal when selecting a modal", () => {
    cy.SearchEntityandOpen("SimpleModal", "Widgets");
    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should("contain", "SimpleModal");
    cy.get(widgets.modalCloseButton).click({ force: true });
  });
  it("Opens modal when selecting a widget inside a modal", () => {
    cy.SearchEntityandOpen("Simple_Modal_Text", "Widgets");
    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should(
      "contain",
      "Simple_Modal_Text",
    );
    cy.get(widgets.modalCloseButton).click({ force: true });
  });
  it("Switches tabs when selecting a tab", () => {
    cy.SearchEntityandOpen("UnselectedTab", "Widgets");
    // Assert correct tab is open
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").contains("UnselectedTab");
  });
  it("Switches tabs when selecting a widget inside other tab", () => {
    cy.SearchEntityandOpen("Button6", "Widgets");
    // Assert correct tab is open and button selected
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").contains("UnselectedTab");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button6");
  });
  it("Switches tabs with a button inside the tab", () => {
    cy.get(".t--page-switch-tab")
      .contains("UnselectedTab")
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgets.buttonWidget).contains("Unselected").click({ force: true });
    // Assert tab is switched
    cy.get(".t--page-switch-tab.is-active").should("contain", "InternalTab");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button6");
  });
  it("Switches tabs when selecting a widget inside hidden tab", () => {
    cy.SearchEntityandOpen("Button7", "Widgets");
    // Assert button is selected
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").should("not.exist");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button7");
  });
  it("Assert the overkill", () => {
    cy.SearchEntityandOpen("OverKillText", "Widgets");
    // Assert that widget is seen
    cy.get(commonLocators.propertyPaneTitle).should("contain", "OverKillText");
    cy.get(`div[data-testid='t--selected']`)
      .should("have.length", 1)
      .should("have.class", "t--draggable-textwidget")
      .contains("Overkill Widget");
  });
});
