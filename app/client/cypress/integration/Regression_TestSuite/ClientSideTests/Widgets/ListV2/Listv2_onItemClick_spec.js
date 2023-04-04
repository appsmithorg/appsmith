const commonlocators = require("../../../../../locators/commonlocators.json");

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

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
    cy.wait(300);
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(1)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Green_1");
    cy.get(commonlocators.toastBody).first().click();
    cy.wait(300);

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(2)
      .click({ force: true });

    cy.validateToastMessage("ListWidget_Red_2");
    cy.get(commonlocators.toastBody).first().click();
    cy.wait(300);
  });

  it("2. List widget V2 with onItemClick shouldn't be triggered when child widget is clicked", () => {
    cy.get(widgetSelector("Image1")).first().click({ force: true });
    cy.get(commonlocators.toastmsg).should("not.exist");
  });
});
