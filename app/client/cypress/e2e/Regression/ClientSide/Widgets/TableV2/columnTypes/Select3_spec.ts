import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  table,
  locators,
} from "../../../../../../support/Objects/ObjectsCore";
import {
  getWidgetSelector,
  WIDGET,
} from "../../../../../../locators/WidgetLocators";

const tableData = `[
    {
      "id": 2,
      "name": "saicharan",
      "gender": "M"
    },
    {
      "id": 3,
      "name": "Raju",
      "gender": "M"
    },
    {
      "id": 4,
      "name": "Rajesh",
      "gender": "M"
    },
    {
      "id": 5,
      "name": "Lahari",
      "gender": "F"
    },
    {
      "id": 6,
      "name": "Sneha",
      "gender": "F"
    },
    {
      "id": 7,
      "name": "Varshini",
      "gender": "F"
    },
    {
      "id": 8,
      "name": "Vidmahi",
      "gender": "F"
    },
    {
      "id": 9,
      "name": "nikhil",
      "gender": "M"
    }
  ]`;
const updatedTableData = `[
    {
      "id": 2,
      "name": "saicharan",
      "gender": "27"
    },
    {
      "id": 3,
      "name": "Raju",
      "gender": "M"
    },
    {
      "id": 4,
      "name": "Rajesh",
      "gender": "M"
    },
    {
      "id": 5,
      "name": "Lahari",
      "gender": "F"
    },
    {
      "id": 6,
      "name": "Sneha",
      "gender": "F"
    },
    {
      "id": 7,
      "name": "Varshini",
      "gender": "F"
    },
    {
      "id": 8,
      "name": "Vidmahi",
      "gender": "F"
    },
    {
      "id": 9,
      "name": "nikhil",
      "gender": "M"
    }
  ]`;

describe(
  "Table widget v2: select column displayAs property test",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 300);
      propPane.EnterJSContext("Table data", tableData);
    });

    it("Check if property displayAs, helperText are visible", function () {
      table.ChangeColumnType("gender", "Select", "v2");
      table.EditColumn("gender", "v2");
      agHelper.GetNAssertContains(
        locators._helperText,
        "Each computed value here represents default value/display value",
      );
      agHelper.AssertElementExist(propPane._propertyControl("displayas"));
    });
    it("Check that select options value and label are being present on table when displayAs = value or label", function () {
      propPane.UpdatePropertyFieldValue(
        "Options",
        `[
            {
            "label":"female",
            "value":"F"
            },
            {
            "label":"male",
            "value":"M"
            }
          ]`,
      );
      propPane.SelectPropertiesDropDown("Display as", "Value");
      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("M");
      });
      table.ReadTableRowColumnData(4, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("F");
      });

      propPane.SelectPropertiesDropDown("Display as", "Label");

      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("male");
      });
      table.ReadTableRowColumnData(4, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("female");
      });
    });
    it("Check computed value appearance in table and validation error in select options", function () {
      let propPaneBack = "[data-testid='t--property-pane-back-btn']";

      agHelper.SelectDropdownList("Column type", "Plain text");
      propPane.TogglePropertyState("Editable", "On");
      table.EditTableCell(0, 2, "27");
      // Click on the save button
      agHelper.GetNClickByContains(
        table._tableRowColumnData(0, 3, "v2"),
        "Save",
      );
      cy.get(propPaneBack).click({ force: true });
      propPane.EnterJSContext("Table data", updatedTableData);
      table.ChangeColumnTypeWithoutNavigatingBackToPropertyPane(
        "gender",
        "Select",
        "v2",
      );

      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("");
      });

      propPane.SelectPropertiesDropDown("Display as", "Value");

      table.ReadTableRowColumnData(0, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("27");
      });

      agHelper
        .GetElement(`${propPane._propertyControl("options")}`)
        .then(($elem: any) => {
          agHelper.TypeIntoTextArea($elem, " ");
        });

      agHelper.VerifyEvaluatedErrorMessage(
        "Computed Value at row: [1] is not present in the select options.",
      );
    });
    it("Check that while editing cell's value is changed to label or value of select options based on displayAs property", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 600);
      propPane.TypeTextIntoField(
        "Text",
        "{{Table1.primaryColumns.gender.computedValue}}",
      );

      // Click on edit icon of select cell
      agHelper.HoverElement(table._tableRow(1, 2, "v2"));
      agHelper.GetNClick(
        table._tableRow(1, 2, "v2") + " " + table._editCellIconDiv,
        0,
        true,
      );

      agHelper.ContainsNClick("male", 0);
      table.ReadTableRowColumnData(1, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("M");
      });
      agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then((value) => {
        expect(value).to.equal(
          '[  "27",  "M",  "M",  "F",  "F",  "F",  "F",  "M"]',
        );
      });

      // open table property pane:
      agHelper.GetNClick(getWidgetSelector(WIDGET.TABLE), 0, true);
      propPane.SelectPropertiesDropDown("Display as", "Label");

      agHelper.HoverElement(table._tableRow(1, 2, "v2"));
      agHelper.GetNClick(
        table._tableRow(1, 2, "v2") + " " + table._editCellIconDiv,
        0,
        true,
      );
      agHelper.ContainsNClick("male", 0);
      table.ReadTableRowColumnData(1, 2, "v2").then(($cellData) => {
        expect($cellData).to.eq("male");
      });
    });
  },
);
