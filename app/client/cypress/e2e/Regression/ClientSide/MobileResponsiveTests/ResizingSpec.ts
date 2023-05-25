import * as commonlocators from "../../../../locators/commonlocators.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  DeployMode: deployMode,
  EntityExplorer: ee,
} = ObjectsRegistry;
const resizeHandles = {
  left: "t--resizable-handle-LEFT",
  right: "t--resizable-handle-RIGHT",
  bottom: "t--resizable-handle-BOTTOM",
  bottomLeft: "t--resizable-handle-BOTTOM|LEFT",
  bottomRight: "t--resizable-handle-BOTTOM|RIGHT",
};
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
      Object.values(resizeHandles).forEach((eachHandle) => {
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
      Object.values(resizeHandles).forEach((eachHandle) => {
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
        "t--resizable-handle-LEFT",
        "t--resizable-handle-BOTTOM",
        "t--resizable-handle-BOTTOM|LEFT",
        "t--resizable-handle-BOTTOM|RIGHT",
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
        "t--resizable-handle-LEFT",
        "t--resizable-handle-BOTTOM",
        "t--resizable-handle-BOTTOM|LEFT",
        "t--resizable-handle-BOTTOM|RIGHT",
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
        "t--resizable-handle-RIGHT",
        "t--resizable-handle-BOTTOM",
        "t--resizable-handle-BOTTOM|LEFT",
        "t--resizable-handle-BOTTOM|RIGHT",
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
        "t--resizable-handle-RIGHT",
        "t--resizable-handle-BOTTOM",
        "t--resizable-handle-BOTTOM|LEFT",
        "t--resizable-handle-BOTTOM|RIGHT",
      ].forEach((eachHandle) => {
        cy.get(`[data-testid='${eachHandle}']`)
          .first()
          .should("have.css", "cursor", "grab");
      });
    });
  });
});
