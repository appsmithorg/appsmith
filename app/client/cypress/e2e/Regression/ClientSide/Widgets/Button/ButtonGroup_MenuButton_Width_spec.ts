const commonlocators = require("../../../../../locators/commonlocators.json");
import { agHelper } from "../../../../../support/Objects/ObjectsCore";

describe(
  "In a button group widget, menu button width",
  { tags: ["@tag.Widget", "@tag.Button", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("ButtonGroup_MenuButton_Width_dsl");
    });

    it("1. If target width is smaller than min-width, The menu button popover width should be set to minimum width", () => {
      cy.get(commonlocators.layoutControls).eq(3).click();
      const widgetId = "yxjq5sck7d";
      // Get the default menu button
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .last()
        .as("target");
      // Open popover
      cy.get("@target").click();

      agHelper.GetWidth(commonlocators.canvas);
      cy.get("@eleWidth").then((mainCanvasWidth) => {
        const minWidth = (12 / 64) * mainCanvasWidth;
        // Get the target width
        agHelper.GetWidth("@target");
        cy.get("@eleWidth").then((targetWidth) => {
          expect(targetWidth).to.be.lessThan(minWidth);
          // Check if popover width is set to its target width
          cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
            "have.css",
            "width",
            `${minWidth}px`,
          );
        });
      });
    });

    it("2. If target width is bigger than min width, The menu button popover width should always be the same as the target width", () => {
      const minWidth = 12 * 12.3125;
      const widgetId = "t5l24fccio";
      agHelper.Sleep(2000);
      // Get the default menu button
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .last()
        .as("target");
      // Open popover
      cy.get("@target").click();
      // Get the target width
      // cy.get("@target")
      //   .invoke("outerWidth")

      agHelper.GetWidth("@target");
      cy.get("@eleWidth").then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
    });

    it("3. After converting a simple button to a menu button, The menu button popover width should always be the same as the target width", () => {
      const minWidth = 12 * 12.3125;
      const widgetId = "t5l24fccio";
      const menuButtonId = "groupButton1";
      // Change the first button type to menu
      cy.editColumn(menuButtonId);
      cy.get(".ads-v2-segmented-control-value-MENU").click({ force: true });
      cy.get(".t--add-menu-item-btn").click();
      // Get the newly converted menu button
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .first()
        .as("target");
      // Open popover
      cy.get("@target").click();
      // Get the target width
      agHelper.GetWidth("@target");
      cy.get("@eleWidth").then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
    });

    it("4. If an existing menu button width changes, its popover width should always be the same as the changed target width", () => {
      const minWidth = 12 * 12.3125;
      const widgetId = "t5l24fccio";
      cy.get("[data-testid='t--property-pane-back-btn']").click();
      // Change the first button text
      cy.get(".t--property-control-buttons input")
        .first()
        .type("increase width");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // Get the menu button with its width changed
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .first()
        .as("target");
      // Open popover
      cy.get("@target").click();
      // Get the target width
      agHelper.GetWidth("@target");
      cy.get("@eleWidth").then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
    });

    it("5. After changing the orientation to vertical , The menu button popover width should always be the same as the target width", () => {
      const widgetId = "mr048y04aq";
      // Open property pane of ButtonGroup3
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .first()
        .click();
      cy.moveToStyleTab();
      // Change its orientation to vetical
      cy.get(".ads-v2-segmented-control-value-vertical").click({ force: true });
      // Get the default menu button
      cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
        .children()
        .last()
        .as("target");
      // Open popover
      cy.get("@target").click();
      // Get the target width
      agHelper.GetWidth("@target");
      cy.get("@eleWidth").then((targetWidth) => {
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
    });
  },
);
