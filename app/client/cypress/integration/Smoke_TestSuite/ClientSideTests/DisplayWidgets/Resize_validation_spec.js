const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/resizeFlow.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Resize workflow with drag and drop", function() {
  this.beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Should not create duplicate versions of widget on drop from explorer", function() {
    cy.wait(30000);
    cy.get(explorer.addWidget).click();
    //cy.get('.ur--has-border').click({force : true})
    //cy.dragAndDropToCanvas("dividerwidget", { x: 140, y: 200 });
    const selector = `.t--widget-card-draggable-dividerwidget`;
    cy.wait(500);
    cy.get(selector)
      .trigger("dragstart", { force: true })
      .trigger("mousemove", 140, 200, { force: true });
    cy.get(explorer.dropHere)
      .trigger("mousemove", 130, 200, { eventConstructor: "MouseEvent" })
      .wait(2000)
      .trigger("mousemove", 140, 200, { eventConstructor: "MouseEvent" })
      .wait(2000)
      .trigger("mousemove", 160, 200, { eventConstructor: "MouseEvent" })
      .wait(2000)
      .trigger("mouseup", 140, 200, { eventConstructor: "MouseEvent" });
    cy.openPropertyPane("dividerwidget");
    cy.deleteWidget(widgetsPage.chartWidget);
    cy.get(widgetsPage.dropdownwidget).should("have.length", 2);
  });
});
