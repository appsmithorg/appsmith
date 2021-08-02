const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetList = [
  "inputwidget",
  "dropdownwidget",
  "buttonwidget",
  "checkboxwidget",
  "datepickerwidget",
  "richtexteditorwidget",
  "filepickerwidget",
  "switchwidget",
  "containerwidget",
];

//const widgetList = ["radiowidget"];
//const widgetList = ["inputwidget"];
describe("Widget property pane draggable", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Property pane initial position same untill it is dragged", function() {
    for (const testWidget of widgetList) {
      cy.openPropertyPane(testWidget);
      cy.get("#popper-draghandler").then((oldPorpPane) => {
        const oldPropPanePosition = oldPorpPane[0].getBoundingClientRect();
        cy.get(commonlocators.collapsesection)
          .first()
          .click();
        cy.get(commonlocators.editPropCrossButton).click({ force: true });
        cy.openPropertyPane(testWidget);
        cy.get("#popper-draghandler").then((newPropPane) => {
          const newPropPanePosition = newPropPane[0].getBoundingClientRect();
          cy.get(commonlocators.editPropCrossButton).click({ force: true });
          expect(oldPropPanePosition.top).to.be.equal(newPropPanePosition.top);
          expect(oldPropPanePosition.left).to.be.equal(
            newPropPanePosition.left,
          );
        });
      });
    }
  });
  it("Property pane position should stay same after dragging down", () => {
    for (const testWidget of widgetList) {
      cy.openPropertyPane(testWidget);
      cy.get("#popper-draghandler")
        .trigger("mousedown", { which: 1 })
        .trigger("mousemove", { clientX: 400, clientY: 500 })
        .trigger("mouseup", { force: true });
      cy.get("#popper-draghandler").then((oldPorpPane) => {
        const oldPropPanePosition = oldPorpPane[0].getBoundingClientRect();
        cy.get(commonlocators.editPropCrossButton).click({ force: true });
        cy.openPropertyPane("containerwidget");
        cy.get("#popper-draghandler").then((newPropPane) => {
          const newPropPanePosition = newPropPane[0].getBoundingClientRect();
          cy.get(commonlocators.editPropCrossButton).click({ force: true });
          expect(oldPropPanePosition.top).to.be.equal(newPropPanePosition.top);
          expect(oldPropPanePosition.left).to.be.equal(
            newPropPanePosition.left,
          );
        });
      });
    }
  });

  it("Property pane should come back into view if forced to drop out of view", () => {
    for (const testWidget of widgetList) {
      cy.openPropertyPane(testWidget);
      cy.get("#popper-draghandler")
        .trigger("mousedown", { which: 1 })
        .trigger("mousemove", { clientX: -10, clientY: -20 })
        .trigger("mouseup", { force: true });
      cy.get("#popper-draghandler").then((porpPane) => {
        const propPanePosition = porpPane[0].getBoundingClientRect();
        expect(propPanePosition.top).to.be.greaterThan(0);
        expect(propPanePosition.left).to.be.gte(0);
      });
      cy.get("#popper-draghandler")
        .trigger("mousedown", { which: 1 })
        .trigger("mousemove", { clientX: 1600, clientY: 800 })
        .trigger("mouseup", { force: true });
      cy.get("#popper-draghandler").then((porpPane) => {
        const propPanePosition = porpPane[0].getBoundingClientRect();
        cy.get(commonlocators.editPropCrossButton).click({ force: true });
        expect(propPanePosition.top).to.be.lessThan(
          Cypress.config().viewportHeight - propPanePosition.height,
        );
        expect(propPanePosition.left).to.be.lessThan(
          Cypress.config().viewportWidth - propPanePosition.width,
        );
      });
    }
  });
});
