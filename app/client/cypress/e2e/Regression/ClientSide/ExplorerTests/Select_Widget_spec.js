import commonLocators from "../../../../locators/commonlocators.json";
import widgets from "../../../../locators/Widgets.json";
const widgetLocators = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Explorer hidden widget Selection", () => {
  before(() => {
    _.agHelper.AddDsl("explorerHiddenWidgets");
  });
  afterEach(() => {
    cy.get(commonLocators.canvas).click({ force: true });
  });
  it("1. Opens modal when selecting a modal", () => {
    _.entityExplorer.SelectEntityByName("SimpleModal", "Widgets");

    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should("contain", "SimpleModal");
    cy.get(widgets.modalCloseButton).click({ force: true });
  });

  it("2. Opens modal when selecting a widget inside a modal", () => {
    _.entityExplorer.SelectEntityByName("Simple_Modal_Text", "Widgets");

    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should(
      "contain",
      "Simple_Modal_Text",
    );
    cy.get(widgets.modalCloseButton).click({ force: true });
  });

  it("3. Switches tabs when selecting a tab", () => {
    _.entityExplorer.ExpandCollapseEntity("Tabs1");
    _.entityExplorer.SelectEntityByName("UnselectedTab", "Widgets");

    // Assert correct tab is open
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").contains("UnselectedTab");
  });

  it("4. Switches tabs when selecting a widget inside other tab", () => {
    _.entityExplorer.ExpandCollapseEntity("UnselectedTab");
    _.entityExplorer.SelectEntityByName("Button6", "Widgets");

    // Assert correct tab is open and button selected
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").contains("UnselectedTab");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button6");
  });
  it("5. Switches tabs with a button inside the tab", () => {
    cy.get(".t--page-switch-tab")
      .contains("UnselectedTab")
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgets.buttonWidget).contains("Unselected").click({ force: true });
    // Assert tab is switched
    cy.get(".t--page-switch-tab.is-active").should("contain", "InternalTab");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button6");
  });
  it("6. Switches tabs when selecting a widget inside hidden tab", () => {
    _.entityExplorer.ExpandCollapseEntity("Tab 3");
    _.entityExplorer.SelectEntityByName("Button7", "Widgets");

    // Assert button is selected
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").should("not.exist");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button7");
  });

  it("7. Assert the overkill", () => {
    _.entityExplorer.ExpandCollapseEntity("Overkill_Modal");
    _.entityExplorer.ExpandCollapseEntity("Tabs2");
    _.entityExplorer.ExpandCollapseEntity("Tab 2");
    _.entityExplorer.ExpandCollapseEntity("Tabs3");
    _.entityExplorer.ExpandCollapseEntity("Canvas9");
    _.entityExplorer.ExpandCollapseEntity("Tabs4");
    _.entityExplorer.ExpandCollapseEntity("Canvas11");
    _.entityExplorer.ExpandCollapseEntity("Tabs5");
    _.entityExplorer.ExpandCollapseEntity("Canvas13");
    _.entityExplorer.SelectEntityByName("OverKillText", "Widgets");

    // Assert that widget is seen
    cy.get(commonLocators.propertyPaneTitle).should("contain", "OverKillText");
    cy.get(`div[data-testid='t--selected']`)
      .should("have.length", 1)
      .should("have.class", "t--draggable-textwidget")
      .contains("Overkill Widget");
  });
});
