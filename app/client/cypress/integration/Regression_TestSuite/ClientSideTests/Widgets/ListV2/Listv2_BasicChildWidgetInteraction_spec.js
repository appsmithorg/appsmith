const emptyListDSL = require("../../../../../fixtures/Listv2/emptyList.json");
const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function dragAndDropToWidget(widgetType, destinationWidget, { x, y }) {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.wait(800);
  cy.get(selector)
    .scrollIntoView()
    .trigger("dragstart", { force: true })
    .trigger("mousemove", x, y, { force: true });
  const selector2 = `.t--draggable-${destinationWidget}`;
  cy.get(selector2)
    .first()
    .scrollIntoView()
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
}

function deleteAllWidgetsInContainer() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .first()
    .click({
      force: true,
    });
  cy.get("body").type(`{${modifierKey}}{a}`);
  cy.get("body").type("{del}");

  cy.wait(200);
}

function checkSelectedRadioValue(selector, value) {
  /**
   * This function checks if the radio button is checked.
   * It also checks the value of the checked radio button.
   */
  cy.get(`${selector} input`).should("be.checked");
  cy.get(`${selector} input:checked`).should("have.value", value);
}

describe("List widget v2 - Basic Child Widget Interaction", () => {
  before(() => {
    cy.addDsl(emptyListDSL);
    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.wait(3000); // for dsl to settle
  });

  it("1. Child widgets", () => {
    // Drop Input widget
    dragAndDropToWidget("inputwidgetv2", "containerwidget", {
      x: 250,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.inputWidget).should("exist");

    // Type value
    cy.get(publishLocators.inputWidget).find("input").type("abcd");

    // Verify if the value got typed
    cy.get(publishLocators.inputWidget)
      .find("input")
      .should("have.value", "abcd");

    deleteAllWidgetsInContainer();

    // Drop Select widget
    dragAndDropToWidget("selectwidget", "containerwidget", {
      x: 250,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.selectwidget).should("exist");

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.selectwidget
          }`,
        )
        .should("have.length", 3),
    );

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

    deleteAllWidgetsInContainer();

    // Drop Checkbox widget
    dragAndDropToWidget("checkboxgroupwidget", "containerwidget", {
      x: 250,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.checkboxGroupWidget).should("exist");

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.checkboxGroupWidget
          }`,
        )
        .should("have.length", 3),
    );

    cy.wait(2000); //for widgets to settle

    // select green & Verify Green selected

    cy.get(publishLocators.checkboxGroupWidget)
      .find(".bp3-checkbox")
      .contains("Green")
      .click({ force: true })
      .wait(500)
      .siblings("input")
      .should("be.checked");

    // Verify Blue selected
    cy.get(publishLocators.checkboxGroupWidget)
      .find(".bp3-checkbox")
      .contains("Blue")
      .siblings("input")
      .should("be.checked");
    cy.get(publishPage.backToEditor).click({ force: true });
    deleteAllWidgetsInContainer();

    // Drop Switch widget
    dragAndDropToWidget("switchwidget", "containerwidget", {
      x: 250,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.switchwidget).should("exist");

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.switchwidget
          }`,
        )
        .should("have.length", 3),
    );

    // Verify checked
    cy.get(publishLocators.switchwidget).find("input").should("be.checked");
    cy.wait(1000);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.switchwidget
          }`,
        )
        .should("have.length", 3),
    );
    // Uncheck & Verify unchecked
    cy.get(publishLocators.switchwidget)
      .find("label")
      .first()
      .click()
      .wait(500)
      .should("not.be.checked");

    cy.get(publishPage.backToEditor).click({ force: true });
    deleteAllWidgetsInContainer();

    // Drop Radio widget
    dragAndDropToWidget("radiogroupwidget", "containerwidget", {
      x: 250,
      y: 50,
    });

    // Verify drop
    cy.get(publishLocators.radioWidget).should("exist");

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.radioWidget
          }`,
        )
        .should("have.length", 3),
    );

    // Check radio with value=1 is selected
    checkSelectedRadioValue(publishLocators.radioWidget, "Y");
    cy.wait(1000);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("List1")} ${containerWidgetSelector} ${
            publishLocators.radioWidget
          }`,
        )
        .should("have.length", 3),
    );
    // Check option 2 and then check it's value:
    cy.get(`${publishLocators.radioWidget} input`).check("N", { force: true });
    checkSelectedRadioValue(publishLocators.radioWidget, "N");
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
