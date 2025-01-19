import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  propPane,
  apiPage,
  dataManager,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Statbox Widget",
  { tags: ["@tag.All", "@tag.Statbox", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("StatboxDsl");
    });

    it("1. Open Existing Statbox & change background color & verify", () => {
      EditorNavigation.SelectEntityByName("Statbox1", EntityType.Widget);
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

    it("2. Verify Statbox icon button's onClick action and change the icon to first available icon", () => {
      EditorNavigation.SelectEntityByName(
        "IconButton1",
        EntityType.Widget,
        {},
        ["Statbox1"],
      );
      cy.get(".t--property-pane-section-general").then(() => {
        // changing the icon to arrow-up
        agHelper.GetNClick(".bp3-button-text");
        agHelper.GetNClick(".bp3-icon", 0, true);
        // opening modal from onClick action of icon button
        cy.createModal("Modal", "onClick");
      });
      // verifying the changed icon
      agHelper.GetNClick(".bp3-icon", 0, true);
      // verifying modal has been added
      cy.get(".t--modal-widget .t--draggable-iconbuttonwidget").click({
        force: true,
      });
      cy.get("span:contains('Close')").closest("div").first().click(); //closing modal
    });

    it("3. Bind datasource to statbox", () => {
      apiPage.CreateAndFillApi(dataManager.paginationUrl(), "MockApi");
      apiPage.RunAPI();
      // binding datasource to text widget in statbox
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Statbox1",
      ]);
      propPane.MoveToTab("Content");
      propPane.UpdatePropertyFieldValue("Text", "{{MockApi.data[0].id}}");
      agHelper.AssertText(propPane._widgetToVerifyText("Text1"), "text", "10"); //it will always be 10 due to pagination url setting
    });
  },
);
