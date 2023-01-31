const emptyListDSL = require("../../../../../fixtures/Listv2/emptyList.json");
const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper;

function checkSelectedRadioValue(selector, value) {
  /**
   * This function checks if the radio button is checked.
   * It also checks the value of the checked radio button.
   */
  cy.get(`${selector} input`).should("be.checked");
  cy.get(`${selector} input:checked`).should("have.value", value);
}

describe("List widget v2 - Basic Child Widget Interaction", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.addDsl(emptyListDSL);
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Input widget", () => {
    // Drop Input widget
    cy.dragAndDropToWidget("inputwidgetv2", "containerwidget", {
      x: 50,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.inputWidget).should("exist");

    // Type value
    cy.get(publishLocators.inputWidget)
      .find("input")
      .type("abcd");

    // Verify if the value got typed
    cy.get(publishLocators.inputWidget)
      .find("input")
      .should("have.value", "abcd");
  });

  it("2. Select widget", () => {
    // Drop Select widget
    cy.dragAndDropToWidget("selectwidget", "containerwidget", {
      x: 50,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.selectwidget).should("exist");

    cy.PublishtheApp();

    // open the select widget
    cy.get(publishLocators.selectwidget)
      .eq(0)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    // Select the Red option from dropdown list
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Red")
      .click({ force: true });

    // Assert if the select widget has Red as the selected value
    cy.get(publishLocators.selectwidget).contains("Red");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("3. Checkbox group widget", () => {
    // Drop Select widget
    cy.dragAndDropToWidget("checkboxgroupwidget", "containerwidget", {
      x: 50,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.checkboxGroupWidget).should("exist");

    cy.PublishtheApp();

    // select green
    cy.get(publishLocators.checkboxGroupWidget)
      .find(".bp3-checkbox")
      .contains("Green")
      .click({ force: true });

    // Verify Green selected
    cy.get(publishLocators.checkboxGroupWidget)
      .find(".bp3-checkbox")
      .contains("Green")
      .siblings("input")
      .should("be.checked");

    // Verify Blue selected
    cy.get(publishLocators.checkboxGroupWidget)
      .find(".bp3-checkbox")
      .contains("Blue")
      .siblings("input")
      .should("be.checked");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("4. Switch widget", () => {
    // Drop Select widget
    cy.dragAndDropToWidget("switchwidget", "containerwidget", {
      x: 50,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.switchwidget).should("exist");

    cy.PublishtheApp();

    // Verify checked
    cy.get(publishLocators.switchwidget)
      .find("input")
      .should("be.checked");

    // Uncheck
    cy.get(publishLocators.switchwidget)
      .find("label")
      .first()
      .click({ force: true });

    // Verify unchecked
    cy.get(publishLocators.switchwidget)
      .find("input")
      .first()
      .should("not.be.checked");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("5. Radio group widget", () => {
    // Drop Select widget
    cy.dragAndDropToWidget("radiogroupwidget", "containerwidget", {
      x: 50,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.radioWidget).should("exist");

    cy.PublishtheApp();

    // Check radio with value=1 is selected
    checkSelectedRadioValue(publishLocators.radioWidget, "Y");

    // Check option 2 and then check it's value:
    cy.get(`${publishLocators.radioWidget} input`).check("N", { force: true });
    checkSelectedRadioValue(publishLocators.radioWidget, "N");
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
