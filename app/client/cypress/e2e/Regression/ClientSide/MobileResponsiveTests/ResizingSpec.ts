import {
  agHelper,
  autoLayout,
  draggableWidgets,
  entityExplorer,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Resizing Behaviour in auto-layout",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
    });
    beforeEach(() => {
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Resizing Handles for center aligned free resizing widgets - image widget", function () {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          draggableWidgets.IMAGE,
          mainCanvasWidth / 2,
          600,
        );
        Object.values(locators._resizeHandles).forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("not.have.css", "cursor", "undefined")
            .should("not.have.css", "cursor", "grab");
        });
      });
    });
    it("2. Resizing Handles for center aligned non-resizing widgets - button widget", () => {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "buttonwidget",
          mainCanvasWidth / 2,
          600,
        );
        Object.values(locators._resizeHandles).forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("have.css", "cursor", "grab");
        });
      });
    });
    it("3. Resizing Handles for center aligned height resiziable widgets - table widget", () => {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "tablewidgetv2",
          mainCanvasWidth / 2,
          600,
        );
        cy.get(`[data-testid='t--resizable-handle-BOTTOM']`)
          .first()
          .should("not.have.css", "cursor", "undefined")
          .should("not.have.css", "cursor", "grab");
      });
    });
    it("4. Resizing Handles for end aligned free resizing widgets - image widget", function () {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "imagewidget",
          mainCanvasWidth * 0.8,
          600,
        );
        [
          locators._resizeHandles.left,
          locators._resizeHandles.bottom,
          locators._resizeHandles.bottomLeft,
          locators._resizeHandles.bottomRight,
        ].forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("not.have.css", "cursor", "undefined")
            .should("not.have.css", "cursor", "grab");
        });
      });
    });
    it("5. Resizing Handles for end aligned non-resizing widgets - button widget", () => {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "buttonwidget",
          mainCanvasWidth * 0.8,
          600,
        );
        [
          locators._resizeHandles.left,
          locators._resizeHandles.bottom,
          locators._resizeHandles.bottomLeft,
          locators._resizeHandles.bottomRight,
        ].forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("have.css", "cursor", "grab");
        });
      });
    });

    it("6. Resizing Handles for start aligned free resizing widgets - image widget", function () {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "imagewidget",
          mainCanvasWidth * 0.1,
          600,
        );
        [
          locators._resizeHandles.right,
          locators._resizeHandles.bottom,
          locators._resizeHandles.bottomLeft,
          locators._resizeHandles.bottomRight,
        ].forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("not.have.css", "cursor", "undefined")
            .should("not.have.css", "cursor", "grab");
        });
      });
    });
    it("7. Resizing Handles for start aligned non-resizing widgets - button widget", () => {
      cy.get("#canvas-viewport").then((canvas) => {
        const mainCanvasWidth = canvas.width() || 0;
        entityExplorer.DragDropWidgetNVerify(
          "buttonwidget",
          mainCanvasWidth * 0.1,
          600,
        );
        [
          locators._resizeHandles.right,
          locators._resizeHandles.bottom,
          locators._resizeHandles.bottomLeft,
          locators._resizeHandles.bottomRight,
        ].forEach((eachHandle) => {
          cy.get(`[data-testid='${eachHandle}']`)
            .first()
            .should("have.css", "cursor", "grab");
        });
      });
    });
  },
);
