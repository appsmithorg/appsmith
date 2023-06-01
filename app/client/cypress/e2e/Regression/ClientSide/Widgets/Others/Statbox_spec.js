const dsl = require("../../../../../fixtures/StatboxDsl.json");
const data = require("../../../../../fixtures/example.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Statbox Widget Functionality", function () {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
    cy.addDsl(dsl);
  });

  it("1. Open Existing Statbox from created Widgets list", () => {
    cy.get(".widgets").first().click();
    cy.get(".t--entity .widget")
      .get(".entity-context-menu")
      .last()
      .click({ force: true });
  });

  it("2. Open Existing Statbox, change background color and verify", () => {
    cy.openPropertyPane("statboxwidget");
    // changing the background color of statbox and verying it
    cy.get(".t--property-pane-section-general").then(() => {
      cy.moveToStyleTab();
      cy.get(`${widgetsPage.cellBackground} input`)
        .first()
        .clear()
        .wait(400)
        .type("#FFC13D");
      cy.get(`${widgetsPage.cellBackground} input`).should(
        "have.value",
        "#FFC13D",
      );
    });
  });

  it("3. Verify Statbox icon button's onClick action and change the icon", () => {
    cy.openPropertyPane("iconbuttonwidget");
    cy.get(".t--property-pane-section-general").then(() => {
      //cy.moveToStyleTab();
      // changing the icon to arrow-up
      cy.get(".bp3-button-text").first().click();
      cy.get(".bp3-icon-arrow-up").click().wait(500);
      // opening modal from onClick action of icon button
      cy.createModal("Modal", "onClick");
    });
    // verifying the changed icon
    cy.get(".bp3-icon-arrow-up").should("be.visible").click({ force: true });

    // verifying modal has been added
    cy.get(".t--modal-widget .t--draggable-iconbuttonwidget").click({
      force: true,
    });
    cy.get("span:contains('Close')").closest("div").last().click();
  });

  it("4. Bind datasource to multiple components in statbox", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MockApi");
    cy.enterDatasourceAndPath(
      data.paginationUrl,
      "mock-api?records=20&page=4&size=3",
    );
    cy.SaveAndRunAPI();
    // going to HomePage where the button widget is located and opening it's property pane.
    cy.get(widgetsPage.NavHomePage).click({ force: true });
    _.agHelper.RefreshPage();
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
});
