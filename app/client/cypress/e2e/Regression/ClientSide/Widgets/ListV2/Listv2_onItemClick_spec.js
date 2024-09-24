const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
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
  agHelper.WaitUntilAllToastsDisappear();
}

describe(
  "List widget v2 onItemClick",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Sanity"] },
  () => {
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

      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

      cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
        .eq(1)
        .click({ force: true });

      agHelper.WaitUntilToastDisappear("ListWidget_Green_1");

      cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
        .eq(2)
        .click({ force: true });

      agHelper.WaitUntilToastDisappear("ListWidget_Red_2");
    });

    it("2. List widget V2 with onItemClick should be triggered when child widget without event is clicked", () => {
      //Select first row Image within list
      agHelper.GetNClick(locators._imgWidgetInsideList, 0, true);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

      agHelper.GetNClickByContains(locators._textWidget, "Blue", 0, true);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

      deleteAllWidgetsInContainer();

      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        150,
        50,
        draggableWidgets.CONTAINER,
      );

      agHelper.GetNClick(`${locators._widgetByName("Input1")} input`, 0, true);
      agHelper.AssertElementAbsence(locators._toastMsg);

      deleteAllWidgetsInContainer();

      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.SELECT,
        150,
        50,
        draggableWidgets.CONTAINER,
      );

      //This is clicking Select Widget
      agHelper.ClickButton("Green", 0);
      agHelper.AssertElementAbsence(locators._toastMsg);

      deleteAllWidgetsInContainer();

      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.BUTTON,
        150,
        50,
        draggableWidgets.CONTAINER,
      );

      agHelper.ClickButton("Submit", 0);
      agHelper.WaitUntilToastDisappear("ListWidget_Blue_0");

      propPane.EnterJSContext("onClick", "{{clearStore()}}");
      agHelper.Sleep(1000);

      agHelper.ClickButton("Submit", 0);
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
  },
);
