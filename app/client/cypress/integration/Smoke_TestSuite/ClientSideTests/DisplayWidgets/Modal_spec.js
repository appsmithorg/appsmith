const dsl = require("../../../../fixtures/ModalDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Modal Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Add new Modal", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: -300 });
    cy.get(".t--modal-widget").should("exist");
  });

  it("Open Existing Modal from created Widgets list", () => {
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Widgets)").click({
      multiple: true,
    });
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Modal1)").click({
      multiple: true,
    });
    cy.get(".t--modal-widget").should("exist");
  });
});
