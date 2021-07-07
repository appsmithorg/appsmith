const dsl = require("../../../../fixtures/inputdsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Input Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Add new Input", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("inputwidget", { x: 300, y: 300 });
    cy.get(".t--widget-inputwidget").should("exist");
  });

  it("Input label wrapper do not show if lable and tooltip is empty", () => {
    cy.get(".t--input-label-wrapper").should("not.exist");
  });

  it("Input label renders if label prop is not empty", () => {
    cy.openPropertyPane("inputwidget");
    // enter label in property pan
    cy.get(".t--property-control-labeltext .CodeMirror-code ").type("Label1");

    cy.get(".t--input-widget-label").contains("Label1");
  });

  it("Input tooltip renders if tooltip prop is not empty", () => {
    cy.openPropertyPane("inputwidget");
    // enter tooltip in property pan
    cy.get(".t--property-control-tooltip .CodeMirror-code ").type(
      "Helpfull text for input",
    );

    cy.get(".t--input-widget-tooltip").should("be.visible");
  });
});
