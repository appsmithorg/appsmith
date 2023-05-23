import { WIDGET_PADDING } from "../../../../../src/constants/WidgetConstants";
import {
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "../../../../../src/utils/autoLayout/constants";
const commonlocators = require("../../../../locators/commonlocators.json");

let childHeight = 0;
let containerHeight = 0;
let inputHeight = 0;
const tabsMinHeight = 300 - WIDGET_PADDING;
describe("validate auto height for tabs widget on auto layout canvas", () => {
  it("tabs widget should maintain a minHeight of 30 rows", () => {
    /**
     * Convert app to AutoLayout
     */
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.wait(2000);
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.wait(2000);
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
    cy.wait(2000);

    /**
     * Add Tabs widget.
     */
    cy.dragAndDropToCanvas("tabswidget", { x: 100, y: 200 });
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((height) => {
        containerHeight = parseInt(height?.split("px")[0]);
        // TABS widget has a minHeight of 30 rows.
        expect(containerHeight).to.equal(tabsMinHeight);
      });

    // add an input widget to the tabs widget.
    cy.dragAndDropToWidget("inputwidgetv2", "tabswidget", {
      x: 100,
      y: 100,
    });

    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((height) => {
        childHeight += parseInt(height?.split("px")[0]);
        inputHeight = parseInt(height?.split("px")[0]);
        expect(containerHeight).to.be.greaterThan(childHeight);
      });
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        // Widget maintains a minHeight of 30 rows.
        expect(updatedHeight).to.equal(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on adding child widgets", () => {
    // Add a child Table widget to the container.
    cy.dragAndDropToWidget("tablewidgetv2", "tabswidget", {
      x: 300,
      y: 150,
    });
    cy.wait(1000);
    cy.get(".t--widget-tablewidgetv2")
      .invoke("css", "height")
      .then((height) => {
        childHeight += parseInt(height?.split("px")[0]);
      });
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on toggling visibility of tabs header", () => {
    // Hide tabs header.
    cy.openPropertyPane("tabswidget");
    cy.wait(500);
    cy.get(commonlocators.showTabsControl).click({ force: true });
    cy.wait(500);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(containerHeight - 40); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Show tabs header.
    cy.openPropertyPane("tabswidget");
    cy.wait(500);
    cy.get(commonlocators.showTabsControl).click({ force: true });
    cy.wait(500);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(containerHeight + 40); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });
  });

  it("should update height on switching tabs", () => {
    // Switch to tab 2.
    cy.get(".t--tabid-tab2").click({ force: true });
    cy.wait(500);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Switch to tab 1.
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(500);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on flex wrap at mobile viewport", () => {
    // add an input widget to the tabs widget, in the first row.
    cy.dragAndDropToWidget("inputwidgetv2", "tabswidget", {
      x: 30,
      y: 70,
    });

    // Switch to mobile viewport
    cy.get("#canvas-viewport").invoke("width", `400px`);
    cy.wait(2000);

    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        // Flex wrap would lead to creation of a new row.
        const numOfRowsAdded = 1;
        // Row gap is 8px on mobile viewport (< row gap on desktop).
        const rowGapDiff = ROW_GAP - MOBILE_ROW_GAP;
        const originalRows = 1;
        const totalRowGapDiff = rowGapDiff * originalRows;
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        expect(updatedHeight).to.equal(
          containerHeight +
            inputHeight +
            WIDGET_PADDING +
            numOfRowsAdded * MOBILE_ROW_GAP -
            totalRowGapDiff,
        );
      });
  });

  it("should update height on switching tabs at mobile viewport", () => {
    // Switch to tab 2.
    cy.get(".t--tabid-tab2").click({ force: true });
    cy.wait(2000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Switch to tab 1.
    cy.get(".t--tabid-tab1").click({ force: true });
    cy.wait(500);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on deleting child widgets", () => {
    // Switch to desktop viewport
    cy.get("#canvas-viewport").invoke("width", `1024px`);
    cy.wait(2000);

    // Delete table widget
    cy.openPropertyPane("tablewidgetv2");
    cy.wait(1000);
    cy.get("[data-testid='t--delete-widget']").click({ force: true });
    cy.wait(1000);
    cy.get(".t--widget-tabswidget")
      .invoke("css", "height")
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });
  });
});
