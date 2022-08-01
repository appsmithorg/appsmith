const dsl = require("../../../../fixtures/ModalDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgets = require("../../../../locators/Widgets.json");

describe("Modal Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("1. Add new Modal", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 300 });
    cy.get(".t--modal-widget").should("exist");
  });

  it("2. Open Existing Modal from created Widgets list", () => {
    cy.get(".t--entity-name")
      .contains("WIDGETS")
      .click();
    cy.get(".t--entity-name:contains(Modal1)").click();
    cy.get(".t--modal-widget").should("exist");

    cy.CreateAPI("FirstAPI");

    cy.get(".t--entity-name:contains(Modal1)").click();
    cy.get(".t--modal-widget").should("exist");
  });

  it("3. Display toast on close action", () => {
    cy.SearchEntityandOpen("Modal1");

    cy.get(".t--property-control-onclose")
      .find(".t--js-toggle")
      .click({ force: true });

    cy.testJsontext("onclose", "{{showAlert('test','success')}}");

    cy.wait(1000); //make sure evaluated value disappears
    cy.get(widgets.modalCloseButton).click({ force: true });

    cy.get(commonlocators.toastmsg).contains("test");
  });

  it("4. Should paste modal widgets with main container as parentId", () => {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.SearchEntityandOpen("Modal1");
    cy.wait(200);
    cy.get("body").type(`{${modifierKey}}c`);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");

    cy.wait(1000); //make sure evaluated value disappears
    cy.get(widgets.modalCloseButton).click({ force: true });
    cy.get(".t--modal-widget").should("have.length", 0);

    cy.get("body").type(`{${modifierKey}}v`);

    cy.get('.bp3-collapse-body > [step="0"]')
      .eq(1)
      .children()
      .should("have.length", 3);
    //make sure modalis open on paste
    cy.get(".t--modal-widget").should("have.length", 1);
  });

  it("5. should select modal when clicked on modal label", () => {
    //open modal
    cy.SearchEntityandOpen("Modal1");
    cy.get(".t--modal-widget").should("exist");

    //select text widget inside the modal
    cy.get(".t--modal-widget")
      .find(".t--widget-textwidget")
      .click();
    cy.get(".t--modal-widget")
      .find(".t--widget-textwidget div[data-testid='t--selected']")
      .should("have.length", 1);

    //click on modal's widgetName Label
    cy.get(
      "div[data-testid='t--settings-controls-positioned-wrapper']:contains(Modal1)",
    ).click({
      ctrlKey: true,
    });

    //verify the modal1 is selected
    cy.get(".t--property-pane-title").should("contain", "Modal1");
  });

  it("6. It should paste modal widget on main Container even when copied in group and paste when a container is selected", () => {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.get(explorer.addWidget).click();
    //add an additional modal widget and a container widget
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 300 });
    cy.get(widgets.modalCloseButton).click({ force: true });
    cy.dragAndDropToCanvas("containerwidget", { x: 300, y: 300 });
    cy.get("#switcher--explorer").click();
    cy.get(".t--entity-name")
      .contains("WIDGETS")
      .click();

    //select all widgets and copy
    cy.get(`#div-selection-0`).click({
      force: true,
    });
    cy.get("body").type(`{${modifierKey}}a`);
    cy.get("body").type(`{${modifierKey}}c`);

    //select container widget
    cy.get(`#div-selection-0`).click({
      force: true,
    });
    cy.get(`.t--widget-containerwidget`).click({
      ctrlKey: true,
    });

    //paste
    cy.get("body").type(`{${modifierKey}}v`);

    //verify that the two modal widget should have pasted on the main canvas
    cy.get('.bp3-collapse-body > [step="0"]')
      .eq(1)
      .children()
      .should("have.length", 6);
  });
});
