import * as commonlocators from "../../../../locators/commonlocators.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import * as _ from "../../../../support/Objects/ObjectsCore";

const { AggregateHelper: agHelper, EntityExplorer: ee } = ObjectsRegistry;

describe("Resizing Behaviour in Auto Layout", function () {
  before(() => {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
  });
  beforeEach(() => {
    const isMac = Cypress.platform === "darwin";
    cy.get(".appsmith_widget_0").type(isMac ? "{meta}A" : "{ctrl}A");
    agHelper.PressDelete();
  });
  it("1. Resizing Handles for center aligned free resizing widgets - image widget", function () {
    cy.get("#canvas-viewport").then((canvas) => {
      const mainCanvasWidth = canvas.width() || 0;
      ee.DragDropWidgetNVerify("imagewidget", mainCanvasWidth / 2, 600);
      Object.values(_.locators._resizeHandles).forEach((eachHandle) => {
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
      ee.DragDropWidgetNVerify("buttonwidget", mainCanvasWidth / 2, 600);
      Object.values(_.locators._resizeHandles).forEach((eachHandle) => {
        cy.get(`[data-testid='${eachHandle}']`)
          .first()
          .should("have.css", "cursor", "grab");
      });
    });
  });
  it("3. Resizing Handles for center aligned height resiziable widgets - table widget", () => {
    cy.get("#canvas-viewport").then((canvas) => {
      const mainCanvasWidth = canvas.width() || 0;
      ee.DragDropWidgetNVerify("tablewidgetv2", mainCanvasWidth / 2, 600);
      cy.get(`[data-testid='t--resizable-handle-BOTTOM']`)
        .first()
        .should("not.have.css", "cursor", "undefined")
        .should("not.have.css", "cursor", "grab");
    });
  });
  it("4. Resizing Handles for end aligned free resizing widgets - image widget", function () {
    cy.get("#canvas-viewport").then((canvas) => {
      const mainCanvasWidth = canvas.width() || 0;
      ee.DragDropWidgetNVerify("imagewidget", mainCanvasWidth * 0.8, 600);
      [
        _.locators._resizeHandles.left,
        _.locators._resizeHandles.bottom,
        _.locators._resizeHandles.bottomLeft,
        _.locators._resizeHandles.bottomRight,
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
      ee.DragDropWidgetNVerify("buttonwidget", mainCanvasWidth * 0.8, 600);
      [
        _.locators._resizeHandles.left,
        _.locators._resizeHandles.bottom,
        _.locators._resizeHandles.bottomLeft,
        _.locators._resizeHandles.bottomRight,
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
      ee.DragDropWidgetNVerify("imagewidget", mainCanvasWidth * 0.1, 600);
      [
        _.locators._resizeHandles.right,
        _.locators._resizeHandles.bottom,
        _.locators._resizeHandles.bottomLeft,
        _.locators._resizeHandles.bottomRight,
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
      ee.DragDropWidgetNVerify("buttonwidget", mainCanvasWidth * 0.1, 600);
      [
        _.locators._resizeHandles.right,
        _.locators._resizeHandles.bottom,
        _.locators._resizeHandles.bottomLeft,
        _.locators._resizeHandles.bottomRight,
      ].forEach((eachHandle) => {
        cy.get(`[data-testid='${eachHandle}']`)
          .first()
          .should("have.css", "cursor", "grab");
      });
    });
  });
});
