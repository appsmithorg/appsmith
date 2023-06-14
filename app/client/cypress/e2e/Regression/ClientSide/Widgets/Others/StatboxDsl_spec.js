const widgetsPage = require("../../../../../locators/Widgets.json");
const data = require("../../../../../fixtures/TestDataSet1.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  apiPage,
} from "../../../../../support/Objects/ObjectsCore";

describe("Statbox Widget", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.fixture("StatboxDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Open Existing Statbox from created Widgets list", () => {
    cy.get(".widgets").first().click();
    cy.get(".t--entity .widget")
      .get(".entity-context-menu")
      .last()
      .click({ force: true });
    // Open Existing Statbox, change background color and verify
    cy.openPropertyPane("statboxwidget");
    // changing the background color of statbox and verying it
    cy.get(".t--property-pane-section-general").then(() => {
      cy.moveToStyleTab();
      cy.get(`${widgetsPage.cellBackground} input`)
        .first()
        .clear()
        .wait(400)
        .type("#FFC13D")
        .wait(500);
      cy.get(`${widgetsPage.cellBackground} input`).should(($input) => {
        const value = $input.val();
        expect(value.toLowerCase()).to.equal("#ffc13d"); // Case-insensitive comparison
      });
    });
  });

  it("2. Verify Statbox icon button's onClick action and change the icon", () => {
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

  it("3. Bind datasource to multiple components in statbox", () => {
    apiPage.CreateAndFillApi(
      data.userApi + "/mock-api?records=20&page=4&size=3",
      "MockApi",
    );
    apiPage.RunAPI();
    // going to HomePage where the button widget is located and opening it's property pane.
    // binding datasource to text widget in statbox
    entityExplorer.SelectEntityByName("Text1", "Statbox1");
    propPane.UpdatePropertyFieldValue("Text", "{{MockApi.data.users[0].id}}");
  });
});
