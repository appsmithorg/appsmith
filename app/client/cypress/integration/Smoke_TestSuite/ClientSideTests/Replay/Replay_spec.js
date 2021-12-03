const commonlocators = require("../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/replay.json");

describe("Undo/Redo functionality", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("checks undo/redo for new widgets", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("checkboxwidget", { x: 200, y: 200 });

    cy.get("body").click();

    cy.get(widgetsPage.checkboxWidget).should("exist");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.checkboxWidget).should("not.exist");

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(widgetsPage.checkboxWidget).should("exist");
  });

  // it("checks moving of widgets", function() {
  //   cy.document().then((doc) => {
  //     const initialPosition = doc
  //       .querySelector(widgetsPage.checkboxWidget)
  //       .getBoundingClientRect();

  //     cy.get(commonlocators.editIcon)
  //       .trigger("mousedown", { which: 1 })
  //       .trigger("dragstart", { force: true });

  //     cy.get(explorer.dropHere)
  //       .trigger("mousemove", 200, 300, { eventConstructor: "MouseEvent" })
  //       .trigger("mousemove", 200, 300, { eventConstructor: "MouseEvent" })
  //       .trigger("mouseup", 200, 300, { eventConstructor: "MouseEvent" });

  //     cy.wait(1000).then(() => {
  //       const positionAfterChange = doc
  //         .querySelector(widgetsPage.checkboxWidget)
  //         .getBoundingClientRect();

  //       expect(positionAfterChange.top).to.not.equal(initialPosition.top);
  //     });

  //     cy.get("body").type(`{${modifierKey}}z`);

  //     cy.wait(1000).then(() => {
  //       const positionAfterUndo = doc
  //         .querySelector(widgetsPage.checkboxWidget)
  //         .getBoundingClientRect();

  //       expect(positionAfterUndo.top).to.equal(initialPosition.top);
  //     });

  //     cy.get("body").type(`{${modifierKey}}{shift}z`);

  //     cy.wait(1000).then(() => {
  //       const positionAfterRedo = doc
  //         .querySelector(widgetsPage.checkboxWidget)
  //         .getBoundingClientRect();

  //       expect(positionAfterRedo.top).to.equal(initialPosition.top);
  //     });
  //   });
  // });

  it("checks undo/redo for toggle control in property pane", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(`${widgetsPage.disable} label`).should("not.have.class", "checked");
    cy.get(widgetLocators.checkboxWidget + " " + "input").should(
      "not.be.disabled",
    );

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);

    cy.get(`${widgetsPage.disable} label`).should("have.class", "checked");
    cy.get(widgetLocators.checkboxWidget + " " + "input").should("be.disabled");
  });

  it("checks undo/redo for input control in property pane", function() {
    cy.get(widgetsPage.inputLabelControl).type("1");
    cy.get(widgetsPage.inputLabelControl).contains("Label1");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.inputLabelControl).contains("Label");
    cy.get(`${publish.checkboxWidget} label`).should("have.text", "Label");

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(widgetsPage.inputLabelControl).contains("Label1");
    cy.get(`${publish.checkboxWidget} label`).should("have.text", "Label1");
  });

  it("checks undo/redo for deletion of widgets", function() {
    cy.deleteWidget(widgetsPage.checkboxWidget);
    cy.get(widgetsPage.checkboxWidget).should("not.exist");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.checkboxWidget).should("exist");

    // cy.get("body").type(`{${modifierKey}}{shift}z`);
    // cy.wait(100);
    // cy.get(widgetsPage.checkboxWidget).should("not.exist");
  });

  it("checks if property Pane is open on undo/redo property changes", function() {
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });

    cy.wait(100);
    cy.get(widgetsPage.inputTextControl).type("1");

    cy.closePropertyPane();

    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait(100);
    cy.get(widgetsPage.propertypaneText).should("exist");
    cy.get(widgetsPage.inputTextControl).contains("Label");

    cy.closePropertyPane();

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.wait(100);
    cy.get(widgetsPage.propertypaneText).should("exist");
    cy.get(widgetsPage.inputTextControl).contains("Label1");
    cy.deleteWidget(widgetsPage.textWidget);
  });

  it("checks if toast is shown while undo/redo widget deletion or creation only the first time", function() {
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    localStorage.removeItem("undoToastShown");
    localStorage.removeItem("redoToastShown");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(commonlocators.toastmsg)
      .eq(0)
      .contains("is removed");
    cy.get(commonlocators.toastmsg)
      .eq(1)
      .contains("REDO");
    cy.get(commonlocators.toastBody)
      .first()
      .click();

    cy.wait(100);
    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get(commonlocators.toastmsg)
      .eq(0)
      .contains("is added back");
    cy.get(commonlocators.toastmsg)
      .eq(1)
      .contains("UNDO");
  });

  it("checks undo/redo for color picker", function() {
    cy.dragAndDropToCanvas("textwidget", { x: 100, y: 100 });

    cy.get(widgetsPage.textColor)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    cy.readTextDataValidateCSS("color", "rgb(3, 179, 101)");

    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(widgetsPage.textColor)
      .first()
      .invoke("attr", "value")
      .should("contain", "#231F20");

    cy.get("body").type(`{${modifierKey}}{shift}z`);

    cy.get(widgetsPage.textColor)
      .first()
      .invoke("attr", "value")
      .should("contain", "#03b365");
  });

  it("checks undo/redo for option control for radio button", function() {
    cy.dragAndDropToCanvas("radiogroupwidget", { x: 200, y: 600 });

    cy.get(widgetsPage.RadioInput)
      .first()
      .type("1");

    cy.get(widgetsPage.RadioInput)
      .first()
      .blur();

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);

    cy.get("body").type(`{${modifierKey}}z`);
    cy.get(widgetsPage.RadioInput)
      .first()
      .invoke("attr", "value")
      .should("contain", "Yes");

    cy.get("body").type(`{${modifierKey}}{shift}z`);
    cy.get(widgetsPage.RadioInput)
      .first()
      .invoke("attr", "value")
      .should("contain", "Yes1");
  });
});
