const dsl = require("../../../../fixtures/ModalDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgets = require("../../../../locators/Widgets.json");

describe("Modal Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Add new Modal", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 300 });
    cy.get(".t--modal-widget").should("exist");
  });

  it("Open Existing Modal from created Widgets list", () => {
    cy.get(".t--entity-name")
      .contains("WIDGETS")
      .click();
    cy.get(".t--entity-name:contains(Modal1)").click();
    cy.get(".t--modal-widget").should("exist");
  });

  it("display toast on close action", () => {
    cy.SearchEntityandOpen("Modal1");

    cy.get(".t--property-control-onclose")
      .find(".t--js-toggle")
      .click({ force: true });

    cy.testJsontext("onclose", "{{showAlert('test','success')}}");

    cy.get(widgets.iconWidgetBtn).click({ force: true });

    cy.get(commonlocators.toastmsg).contains("test");
  });

  it("should paste modal widgets with main container as parentId", () => {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.SearchEntityandOpen("Modal1");
    cy.wait(200);
    cy.get("body").type(`{${modifierKey}}c`);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");

    cy.get(widgets.iconWidgetBtn).click({ force: true });

    cy.get("body").type(`{${modifierKey}}v`);

    cy.get('.bp3-collapse-body > [step="0"]')
      .eq(1)
      .children()
      .should("have.length", 2);
  });
});
