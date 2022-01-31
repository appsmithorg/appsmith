const dsl = require("../../../../fixtures/StatboxDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const data = require("../../../../fixtures/example.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Statbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Open Existing Statbox from created Widgets list", () => {
    cy.get(".widgets")
      .first()
      .click();
    cy.get(".t--entity .widget")
      .get(".entity-context-menu")
      .last()
      .click({ force: true });
  });
  it("Open Existing Statbox, change background color and verify", () => {
    cy.openPropertyPane("statboxwidget");
    // changing the background color of statbox and verying it
    cy.get(".t--property-pane-section-general").then(() => {
      cy.get(".bp3-input-group")
        .clear()
        .type("#FFC13D");
      cy.get(".bp3-input").should("have.value", "#FFC13D");
    });
  });

  it("Verify Statbox icon button's onClick action and change the icon", () => {
    cy.openPropertyPane("iconbuttonwidget");
    cy.get(".t--property-pane-section-general").then(() => {
      // changing the icon to arrow-up
      cy.get(".bp3-button-text")
        .first()
        .click();
      cy.get(".bp3-icon-arrow-up").click();
      // opening modal from onClick action of icon button
      cy.createModal("Modal", "Modal1");
    });
    // verifying the changed icon
    cy.get(".bp3-icon-arrow-up").should("be.visible");
    // verifying modal has been added
    cy.get(".t--draggable-iconbuttonwidget").click();
    cy.xpath("//span[text()='Close']").click();
  });

  it("Bind datasource to multiple components in statbox", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MockApi");
    cy.enterDatasourceAndPath(data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();
    // going to HomePage where the button widget is located and opening it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    // binding datasource to text widget in statbox
    cy.openPropertyPane("textwidget");
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .type("{{MockApi.data.users[0].id}}", {
        parseSpecialCharSequences: false,
      });
  });

  it("Verify Statbox can be placed inside another widget", () => {
    cy.get(explorer.addWidget).click();
    // placing statbox widget inside container widget
    cy.dragAndDropToCanvas("containerwidget", { x: 500, y: 300 });
    cy.dragAndDropToWidget("statboxwidget", "containerwidget", {
      x: 100,
      y: 100,
    });
  });
});
