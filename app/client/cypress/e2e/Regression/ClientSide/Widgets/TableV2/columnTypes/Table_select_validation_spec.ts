import * as _ from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";

describe(
  "Table widget - Select column validation",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 350, y: 500 });
      _.table.AddSampleTableData();
    });
    it("1. should prevent adding a row when a required select column has no data", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      // Allow adding a row in table
      _.propPane.TogglePropertyState("Allow adding a row", "On");

      // Edit step column to select type
      _.table.ChangeColumnType("step", "Select", "v2");
      _.table.EditColumn("step", "v2");

      // Add data to select options
      _.agHelper.UpdateCodeInput(
        _.locators._controlOption,
        `
           [
            {
              "label": "#1",
              "value": "#1"
            },
            {
              "label": "#2",
              "value": "#2"
            },
            {
              "label": "#3",
              "value": "#3"
            }
          ]
        `,
      );

      // Set step column to editable
      _.propPane.TogglePropertyState("Editable", "On");

      // Set step column to required
      _.propPane.TogglePropertyState("Required", "On");

      // Click add a new row
      _.table.AddNewRow();

      // Expect the save row button to be disabled
      _.agHelper.GetElement(_.table._saveNewRow).should("be.disabled");

      // Expect select to have an error color
      _.agHelper
        .GetElement(".bp3-button.select-button")
        .should("have.css", "border-color", "rgb(217, 25, 33)");

      // Select a valid option from the select table cell
      _.agHelper.GetNClick(".bp3-button.select-button");
      _.agHelper.GetElement(".menu-item-link").contains("#1").click();

      // Expect the save row option to be enabled
      _.agHelper.GetElement(_.table._saveNewRow).should("be.enabled");

      // Expect button to have a valid color
      _.agHelper
        .GetElement(".bp3-button.select-button")
        .should("have.css", "border-color", "rgb(85, 61, 233)");

      // Discard save new row
      _.agHelper.GetElement(_.table._discardRow).click({ force: true });
    });

    it("2. should display an error when inline editing a required select cell in a table with no data", () => {
      // Update table data to create emtpy cell in step column
      _.propPane.NavigateBackToPropertyPane();
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        `
            [
              {
                "task": "Drop a table",
                "status": "✅",
                "action": ""
              },
              {
                "step": "#2",
                "task": "Create a query fetch_users with the Mock DB",
                "status": "--",
                "action": ""
              },
              {
                "step": "#3",
                "task": "Bind the query using => fetch_users.data",
                "status": "--",
                "action": ""
              }
            ]
            `,
      );

      // Click the first cell in the step column
      (cy as any).editTableSelectCell(0, 0);

      // Exect the select to have an error color
      _.agHelper
        .GetElement(".bp3-button.select-button")
        .should("have.css", "border-color", "rgb(217, 25, 33)");
    });
  },
);
