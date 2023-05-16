import { WIDGET_PADDING } from "../../../../../src/constants/WidgetConstants";
import { ROW_GAP } from "../../../../../src/utils/autoLayout/constants";
const commonlocators = require("../../../../locators/commonlocators.json");

let childHeight = 0;
let childWidgetCount = 0;
let containerHeight = 0;
const containerPadding = 16;
const borderWidth = 2;
describe("Validate auto height for container like widgets on auto layout canvas", () => {
  it("parent height update on adding or deleting child widgets", () => {
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
    cy.log("widget padding", WIDGET_PADDING);
    /**
     * Add widget.
     */
    cy.dragAndDropToCanvas("containerwidget", { x: 100, y: 200 });

    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((height) => {
        cy.log("container height", height);
        containerHeight = parseInt(height?.split("px")[0]);
      });

    // add an input widget to the container.
    cy.dragAndDropToWidget("inputwidgetv2", "containerwidget", {
      x: 100,
      y: 10,
    });

    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((height) => {
        cy.log("input height", height);
        childHeight += parseInt(height?.split("px")[0]);
        childWidgetCount += 1;
        cy.log("child height", childHeight);
      });
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((newHeight) => {
        cy.log("new height", newHeight);
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        if (childHeight <= updatedHeight - containerPadding)
          expect(updatedHeight).to.equal(containerHeight);
        else {
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          expect(updatedHeight).to.equal(childHeight + containerPadding);
        }
      });

    // Add a child Table widget to the container.
    cy.dragAndDropToWidget("tablewidgetv2", "containerwidget", {
      x: 100,
      y: 76,
    });

    cy.wait(1000);

    cy.get(".t--widget-tablewidgetv2")
      .invoke("css", "height")
      .then((height) => {
        cy.log("table height", height);
        childHeight += parseInt(height?.split("px")[0]);
        childWidgetCount += 1;
        cy.log("child height", childHeight);
      });
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((newHeight) => {
        cy.log("new height", newHeight);
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        cy.log(
          "widget paddings",
          WIDGET_PADDING,
          "child count",
          childWidgetCount,
          "row gap",
          ROW_GAP,
          childHeight +
            containerPadding +
            ROW_GAP +
            WIDGET_PADDING * childWidgetCount +
            borderWidth,
        );
        // expect(updatedHeight).to.equal(
        //   childHeight +
        //     containerPadding +
        //     ROW_GAP +
        //     WIDGET_PADDING * childWidgetCount +
        //     borderWidth,
        // );
        containerHeight = updatedHeight;
      });

    // Delete table widget
    cy.get(".t--widget-tablewidgetv2").click({ force: true });
    cy.wait(1000);
    cy.get(".t--delete-widget").click({ force: true });
    cy.wait(1000);
    childWidgetCount -= 1;
    cy.get(".t--widget-containerwidget")
      .invoke("css", "height")
      .then((newHeight) => {
        cy.log("new height", newHeight);
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });
});
