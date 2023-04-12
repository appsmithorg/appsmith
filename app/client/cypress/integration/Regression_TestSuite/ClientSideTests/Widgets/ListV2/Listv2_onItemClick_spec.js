const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

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

function dragAndDropToWidget(widgetType) {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  const destinationWidget = "containerwidget";
  const x = 250;
  const y = 50;
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

function validateToastExist() {
  cy.validateToastMessage("ListWidget_Blue_0");
  cy.get(commonlocators.toastBody).first().click();
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
    cy.get(commonlocators.toastBody).first().click();
    cy.waitUntil(() =>
      cy.get(commonlocators.toastmsg).should("not.be.visible"),
    );
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(1)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Green_1");
    cy.get(commonlocators.toastBody).first().click();
    cy.waitUntil(() =>
      cy.get(commonlocators.toastmsg).should("not.be.visible"),
    );

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(2)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Red_2");
    cy.get(commonlocators.toastBody).first().click();
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

    dragAndDropToWidget("inputwidgetv2");

    cy.get(`${widgetSelector("Input1")} input`)
      .first()
      .click({ force: true });
    validateToastDoestExist();

    deleteAllWidgetsInContainer();

    dragAndDropToWidget("selectwidget");

    cy.get(`${widgetSelector("Select1")} button`)
      .first()
      .click({ force: true });
    validateToastDoestExist();

    deleteAllWidgetsInContainer();

    dragAndDropToWidget("buttonwidget");
    cy.get(`${widgetSelector("Button1")} button`)
      .first()
      .click({ force: true });
    validateToastExist();

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
