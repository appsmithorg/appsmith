import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget v2 edge case scenario testing",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("tableV2WithTextWidgetDsl");
    });

    it("1. Check if the selectedRowIndices does not contain 2d array", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.ExpandIfCollapsedSection("rowselection");
      propPane.TogglePropertyState("Enable multi-row selection", "On"); //Enable Multi row select

      propPane.UpdatePropertyFieldValue("Default selected rows", "[1]"); //Change the value of default selected row

      propPane.TogglePropertyState("Enable multi-row selection", "Off"); //Disable Multi row select

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[]",
      );

      propPane.TogglePropertyState("Enable multi-row selection", "On"); //Enable Multi row select

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[  1]",
      );
    });

    it("2. Check if the selectedRowIndices does not contain -1", function () {
      cy.openPropertyPane("tablewidgetv2");

      //Update the property default selected row to blank
      cy.updateCodeInput(".t--property-control-defaultselectedrow", "");

      // ensure evaluatedvaluepopup does not show up for empty strings
      cy.get(commonlocators.evaluatedCurrentValue).should("not.exist");

      //Check the value present in the textfield which is selectedRowIndices is blank
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[]",
      );

      //Enable the "Enable Multi Row selection"
      cy.get(widgetsPage.toggleEnableMultirowselection)
        .first()
        .click({ force: true });

      //Check the value present in the textfield which is selectedRowIndices is []
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[]",
      );
      cy.wait(1000);

      //Select the 1st, 2nd and 3rd row
      table.SelectTableRow(0, 0, true, "v2");
      table.SelectTableRow(1, 0, true, "v2");
      table.SelectTableRow(2, 0, true, "v2");

      //Check the value present in the textfield which is selectedRowIndices is [0,1,2]
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[  0,  1,  2]",
      );
    });
  },
);
