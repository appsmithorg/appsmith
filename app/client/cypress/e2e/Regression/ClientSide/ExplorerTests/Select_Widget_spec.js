import commonLocators from "../../../../locators/commonlocators.json";
import widgets from "../../../../locators/Widgets.json";
const widgetLocators = require("../../../../locators/Widgets.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Explorer hidden widget Selection", { tags: ["@tag.IDE", "@tag.PropertyPane"] }, () => {
  before(() => {
    _.agHelper.AddDsl("explorerHiddenWidgets");
  });
  afterEach(() => {
    cy.get(commonLocators.canvas).click({ force: true });
  });
  it("1. Opens modal when selecting a modal", () => {
    EditorNavigation.SelectEntityByName("SimpleModal", EntityType.Widget);

    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should("contain", "SimpleModal");
    cy.get(widgets.modalCloseButton).click({ force: true });
  });

  it("2. Opens modal when selecting a widget inside a modal", () => {
    EditorNavigation.SelectEntityByName("Simple_Modal_Text", EntityType.Widget);

    cy.get(widgetLocators.modalWidget).should("have.length", 1);
    cy.get(commonLocators.propertyPaneTitle).should(
      "contain",
      "Simple_Modal_Text",
    );
    cy.get(widgets.modalCloseButton).click({ force: true });
  });

  it("3. Switches tabs when selecting a tab", () => {
    EditorNavigation.SelectEntityByName(
      "UnselectedTab",
      EntityType.Widget,
      {},
      ["Tabs1"],
    );

    // Assert correct tab is open
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").contains("UnselectedTab");
  });

  it("4. Switches tabs when selecting a widget inside other tab", () => {
    EditorNavigation.SelectEntityByName("Button6", EntityType.Widget, {}, [
      "UnselectedTab",
    ]);

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
    EditorNavigation.SelectEntityByName("Button7", EntityType.Widget, {}, [
      "Tab 3",
    ]);

    // Assert button is selected
    cy.wait(1000);
    cy.get(".t--page-switch-tab.is-active").should("not.exist");
    cy.get(commonLocators.propertyPaneTitle).should("contain", "Button7");
  });

  it("7. Assert the overkill", () => {
    EditorNavigation.SelectEntityByName("OverKillText", EntityType.Widget, {}, [
      "Overkill_Modal",
      "Tabs2",
      "Tab 2",
      "Tabs3",
      "Canvas9",
      "Tabs4",
      "Canvas11",
      "Tabs5",
      "Canvas13",
    ]);

    // Assert that widget is seen
    cy.get(commonLocators.propertyPaneTitle).should("contain", "OverKillText");
    cy.get(`div[data-testid='t--selected']`)
      .should("have.length", 1)
      .should("have.class", "t--draggable-textwidget")
      .contains("Overkill Widget");
  });
});
