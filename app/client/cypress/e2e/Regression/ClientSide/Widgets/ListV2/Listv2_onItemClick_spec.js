const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  draggableWidgets,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

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

  // Clear All Toast
  cy.get(commonlocators.toastBody).each(($el) => {
    cy.wrap($el).click();
  });
  cy.wait(1000);
}

function validateToastExist() {
  cy.validateToastMessage("ListWidget_Blue_0");
  cy.wait(1000);
}

function validateToastDoestExist() {
  cy.wait(500);
  cy.get(commonlocators.toastmsg, { timeout: 100 }).should("not.exist");
}

describe("List widget v2 onItemClick", () => {
  it("1. List widget V2 with onItemClick", () => {
    cy.dragAndDropToCanvas("listwidgetv2", {
      x: 300,
      y: 300,
    });
    cy.openPropertyPane("listwidgetv2");

    cy.get(toggleJSButton("onitemclick")).click({ force: true });

    cy.testJsontext(
      "onitemclick",
      "{{showAlert('ListWidget_' + currentItem.name + '_' + currentIndex,'success')}}",
    );

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .first()
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Blue_0");
    cy.waitUntil(() =>
      cy.get(commonlocators.toastmsg).should("not.be.visible"),
    );
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(1)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Green_1");
    cy.waitUntil(() =>
      cy.get(commonlocators.toastmsg).should("not.be.visible"),
    );

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(2)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Red_2");
    cy.waitUntil(() =>
      cy.get(commonlocators.toastmsg).should("not.be.visible"),
    );
  });

  it("2. List widget V2 with onItemClick should be triggered when child widget without event is clicked", () => {
    cy.get(widgetSelector("Image1")).first().click({ force: true });
    validateToastExist();

    cy.get(widgetSelector("Text1")).first().click({ force: true });
    validateToastExist();

    deleteAllWidgetsInContainer();

    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.INPUT_V2,
      250,
      50,
      draggableWidgets.CONTAINER,
    );

    cy.get(`${widgetSelector("Input1")} input`)
      .first()
      .click({ force: true });
    validateToastDoestExist();

    deleteAllWidgetsInContainer();

    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.SELECT,
      250,
      50,
      draggableWidgets.CONTAINER,
    );

    cy.get(`${widgetSelector("Select1")} button`)
      .first()
      .click({ force: true });
    validateToastDoestExist();

    deleteAllWidgetsInContainer();

    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.BUTTON,
      250,
      50,
      draggableWidgets.CONTAINER,
    );

    cy.get(`${widgetSelector("Button1")} button`)
      .first()
      .click({ force: true });
    validateToastExist();
    cy.get(commonlocators.toastBody).first().click();

    cy.get(widgetsPage.toggleOnClick).click({ force: true });
    cy.get(".t--property-control-onclick").then(($el) => {
      cy.updateCodeInput($el, "{{clearStore()}}");
    });
    cy.wait(1000);

    cy.get(`${widgetSelector("Button1")} button`)
      .first()
      .click({ force: true });
    validateToastDoestExist();
  });
});
