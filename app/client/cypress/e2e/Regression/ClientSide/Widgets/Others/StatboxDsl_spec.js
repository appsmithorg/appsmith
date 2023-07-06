const widgetsPage = require("../../../../../locators/Widgets.json");
const data = require("../../../../../fixtures/TestDataSet1.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  apiPage,
} from "../../../../../support/Objects/ObjectsCore";

describe("Statbox Widget", function () {
  before(() => {
    agHelper.AddDsl("StatboxDsl");
  });

  it("1. Open Existing Statbox & change background color & verify", () => {
    entityExplorer.SelectEntityByName("Statbox1");
    cy.get(".t--property-pane-section-general").then(() => {
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Background color", "#FFC13D");
      propPane.ToggleJSMode("Background color", false);
      cy.get(`${widgetsPage.cellBackground} input`).should(($input) => {
        const value = $input.val();
        expect(value.toLowerCase()).to.equal("#ffc13d"); // Case-insensitive comparison
      });
    });
  });

  it("2. Verify Statbox icon button's onClick action and change the icon", () => {
    entityExplorer.SelectEntityByName("IconButton1", "Statbox1");
    cy.get(".t--property-pane-section-general").then(() => {
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
    cy.get("span:contains('Close')").closest("div").first().click(); //closing modal
  });

  it("3. Bind datasource to statbox", () => {
    apiPage.CreateAndFillApi(
      data.userApi + "/mock-api?records=20&page=4&size=3",
      "MockApi",
    );
    apiPage.RunAPI();
    // binding datasource to text widget in statbox
    entityExplorer.SelectEntityByName("Text1", "Statbox1");
    propPane.UpdatePropertyFieldValue("Text", "{{MockApi.data[0].id}}");
  });
});
