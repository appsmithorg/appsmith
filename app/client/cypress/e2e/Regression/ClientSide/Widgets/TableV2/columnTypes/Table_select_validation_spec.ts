import commonlocators from "../../../../../../locators/commonlocators.json";
import {
  agHelper,
  locators,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";

const hexToRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : null;
};

const validateSelectBorderColor = (color: string) => {
  agHelper
    .GetElement(commonlocators.singleSelectWidgetButtonControl)
    .then(($el) => {
      const borderDangerColor = getComputedStyle($el[0]).getPropertyValue(
        color,
      );
      const borderDangerColorRgb = hexToRgb(borderDangerColor);
      cy.wrap($el).should("have.css", "border-color", borderDangerColorRgb);
    });
};

describe(
  "Table widget - Select column validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Select"] },
  () => {
    before(() => {
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 350, y: 500 });
      table.AddSampleTableData();
    });
    it.only("1. should prevent adding a row when a required select column has no data", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      // Allow adding a row in table
      propPane.TogglePropertyState("Allow adding a row", "On");

      // Edit step column to select type
      table.ChangeColumnType("step", "Select", "v2");
      table.EditColumn("step", "v2");

      // Add data to select options
      agHelper.UpdateCodeInput(
        locators._controlOption,
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
      propPane.TogglePropertyState("Editable", "On");

      // Set step column to required
      propPane.TogglePropertyState("Required", "On");

      // Click add a new row
      table.AddNewRow();

      // Expect the save row button to be disabled
      agHelper.GetElement(table._saveNewRow).should("be.disabled");

      // Expect select to have an error color
      validateSelectBorderColor("--wds-color-border-danger");

      // Select a valid option from the select table cell
      agHelper.GetNClick(commonlocators.singleSelectWidgetButtonControl);
      agHelper
        .GetElement(commonlocators.singleSelectWidgetMenuItem)
        .contains("#1")
        .click();

      // Expect the save row option to be enabled
      agHelper.GetElement(table._saveNewRow).should("be.enabled");

      // Expect button to have a valid color
      validateSelectBorderColor("var(--wds-color-border)");

      // Discard save new row
      agHelper.GetElement(table._discardRow).click({ force: true });
    });

    it("2. should display an error when inline editing a required select cell in a table with no data", () => {
      // Update table data to create emtpy cell in step column
      propPane.NavigateBackToPropertyPane();
      propPane.UpdatePropertyFieldValue(
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
      table.ClickOnEditIcon(0, 0, true);

      // Exect the select to have an error color
      validateSelectBorderColor("--wds-color-border-danger");
    });
  },
);
