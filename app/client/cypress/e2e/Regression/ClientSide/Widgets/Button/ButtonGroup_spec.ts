const explorer = require("../../../../../locators/explorerlocators.json");
const { modifierKey } = require("../../../../../support/Constants");

import { draggableWidgets } from "../../../../../support/Objects/ObjectsCore";
import {
  entityExplorer,
  agHelper,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

import { buttongroupwidgetlocators } from "../../../../../locators/WidgetLocators";

import { PropertyPane } from "../../../../../support/Pages/PropertyPane";

const firstButton = ".t--buttongroup-widget > div > button > div";
const menuButton =
  ".t--buttongroup-widget .bp3-popover2-target > div > button > div";

describe(
  "Button Group Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Button", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON_GROUP);
      agHelper
        .GetElement(buttongroupwidgetlocators.buttongroup)
        .children()
        .should("have.length", 3);
    });

    it("ButtonGroup Widget Functionality on undo after delete", function () {
      // Delete the first Button
      cy.get(".t--property-control-buttons .t--delete-column-btn").eq(0).click({
        force: true,
      });

      // Check if the Button got deleted
      agHelper
        .GetElement(buttongroupwidgetlocators.buttongroup)
        .children()
        .should("have.length", 2);

      // Check the first button
      agHelper.GetNAssertElementText(firstButton, "Add");

      // Undo
      cy.get("body").type(`{${modifierKey}+z}`);

      // Check if the button is back
      agHelper
        .GetElement(buttongroupwidgetlocators.buttongroup)
        .children()
        .should("have.length", 3);

      // Check the first button
      agHelper.GetNAssertElementText(firstButton, "Favorite");

      // Navigate to the first button property pane
      cy.get(".t--property-control-buttons .t--edit-column-btn").eq(0).click({
        force: true,
      });
      cy.wait(1000);
      // check the title
      cy.get(".t--property-pane-title").contains("Favorite");
      // navigate back
      cy.get("[data-testid='t--property-pane-back-btn']").click();
    });

    it("Verify buttons alignments", function () {
      // check first button placement
      cy.editColumn("groupButton2");
      cy.moveToStyleTab();
      // placement text
      cy.get(".t--property-control-placement .rc-select-selection-item").should(
        "have.text",
        "Center",
      );
      // 1st btn
      cy.get(firstButton).should("have.css", "justify-content", "center");
      cy.get(menuButton).should("have.css", "justify-content", "center");
    });

    it("Update Placement and Verify buttons alignments", function () {
      // check first button placement
      cy.selectDropdownValue(
        ".t--property-control-placement .rc-select-selection-item",
        "Between",
      );
      // 1st btn
      cy.get(firstButton)
        .last()
        .should("have.css", "justify-content", "space-between");
      // update dropdown value
      cy.selectDropdownValue(
        ".t--property-control-placement .rc-select-selection-item",
        "Start",
      );
      cy.get(firstButton).last().should("have.css", "justify-content", "start");
      // other button style stay same
      cy.get(menuButton).should("have.css", "justify-content", "center");
    });

    it("Update icon alignment and Verify buttons alignments", function () {
      // align right
      cy.get("[data-value='left']").first().click();
      cy.wait(200);
      // 1st btn
      cy.get(firstButton).eq(1).should("have.css", "flex-direction", "row");
      // align left
      cy.get("[data-value='right']").last().click();
      cy.wait(200);
      // 1st btn
      cy.get(firstButton)
        .eq(1)
        .should("have.css", "flex-direction", "row-reverse");
    });

    after(() => {
      // clean up after done
    });
  },
);
