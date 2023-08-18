import {
  entityExplorer,
  table,
  propPane,
  agHelper,
  deployMode,
  draggableWidgets,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Table Widget V2 property pane feature validation", function () {
  before(() => {
    agHelper.AddDsl("tableV2NewDslWithPagination");
  });

  it("1. Test to validate text color and text background", function () {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("id");
    cy.moveToStyleTab();
    // Changing text color to rgb(219, 234, 254) and validate
    cy.selectColor("textcolor");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(219, 234, 254)");

    // Changing text color to PURPLE and validate using JS
    cy.get(widgetsPage.toggleJsColor).click();
    cy.testCodeMirrorLast("purple");
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");

    // Changing Cell backgroud color to rgb(219, 234, 254) and validate
    cy.selectColor("cellbackground");
    cy.readTableV2dataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(194, 220, 253) none repeat scroll 0% 0% / auto padding-box border-box",
      true,
    );
    // Changing Cell backgroud color to PURPLE and validate using JS
    propPane.EnterJSContext("Cell Background", "purple");
    cy.wait("@updateLayout");
    cy.readTableV2dataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(102, 0, 102) none repeat scroll 0% 0% / auto padding-box border-box",
      true,
    );
    // close property pane
    cy.closePropertyPane();
  });

  it("2. Verify default search text", function () {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    cy.moveToContentTab();
    // Chage deat search text value to "data"
    cy.backFromPropertyPanel();
    cy.testJsontext("defaultsearchtext", "data");
    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
    table.WaitForTableEmpty("v2");
    // Verify the deaullt search text
    cy.get(widgetsPage.searchField).should("have.value", "data");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Verify custom column property name changes with change in column name ([FEATURE]: #17142)", function () {
    // Open property pane
    cy.openPropertyPane("tablewidgetv2");
    cy.moveToContentTab();
    cy.addColumnV2("customColumn18");
    cy.editColumn("customColumn1");
    cy.get(".t--property-control-propertyname pre span span").should(
      "have.text",
      "customColumn18",
    );
    cy.editColName("customColumn00");
    cy.get(".t--property-control-propertyname pre span span").should(
      "have.text",
      "customColumn00",
    );
    cy.get("[data-testid='t--property-pane-back-btn']").click();
    cy.get('[data-rbd-draggable-id="customColumn1"] input').should(
      "have.value",
      "customColumn00",
    );
    cy.get("[data-rbd-draggable-id='customColumn1'] input[type='text']").clear({
      force: true,
    });
    cy.get("[data-rbd-draggable-id='customColumn1'] input[type='text']").type(
      "customColumn99",
      {
        force: true,
      },
    );
    cy.editColumn("customColumn1");
    cy.get(".t--property-control-propertyname pre span span").should(
      "have.text",
      "customColumn99",
    );
    cy.backFromPropertyPanel();
    cy.deleteColumn("customColumn1");
  });

  it("4. It provides currentRow and currentIndex properties in min validation field", function () {
    agHelper.AddDsl("tableV2NewDslWithPagination");
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("orderAmount");
    cy.editColumn("orderAmount");

    propPane.UpdatePropertyFieldValue("Computed value", "{{currentIndex}}");
    cy.changeColumnType("Number");

    propPane.UpdatePropertyFieldValue("Min", "{{currentIndex}}");
    cy.get(".t--evaluatedPopup-error").should("not.exist");

    // Update cell with row : 1, column : orderAmount

    table.EditTableCell(1, 4, -1, false);
    cy.get(".bp3-popover-content").contains("Invalid input");
    table.UpdateTableCell(1, 4, 0);
    cy.get(".bp3-popover-content").contains("Invalid input");
    table.UpdateTableCell(1, 4, 3);
    cy.get(".bp3-popover-content").should("not.exist");

    // Check if currentRow works
    propPane.NavigateBackToPropertyPane();
    table.EditColumn("orderAmount");
    propPane.UpdatePropertyFieldValue("Min", "{{currentRow.id}}");
    propPane.UpdatePropertyFieldValue(
      "Error message",
      "Row at index {{currentIndex}} is not valid",
    );
    cy.get(".t--evaluatedPopup-error").should("not.exist");

    // Update cell with row : 0, column : orderAmount. The min is set to 7 (i.e value of cell in id column)
    table.EditTableCell(1, 4, 8, false);
    cy.get(".bp3-popover-content").should("not.exist");

    table.UpdateTableCell(1, 4, 6);
    cy.get(".bp3-popover-content").contains("Row at index 1 is not valid");

    table.UpdateTableCell(1, 4, 8);
    cy.get(".bp3-popover-content").should("not.exist");

    propPane.UpdatePropertyFieldValue(
      "Error message",
      "Row with id {{currentRow.id}} is not valid",
    );

    table.EditTableCell(1, 4, 5, false);
    cy.get(".bp3-popover-content").contains("Row with id 7 is not valid");

    propPane.UpdatePropertyFieldValue("Min", "");
    propPane.UpdatePropertyFieldValue("Error message", "");

    // Check for currentIndex property on Regex field
    cy.changeColumnType("Plain text");
    propPane.UpdatePropertyFieldValue("Regex", "{{currentIndex}}2");

    cy.get(".t--evaluatedPopup-error").should("not.exist");
    table.EditTableCell(1, 4, 3, false);

    cy.get(".bp3-popover-content").contains("Invalid input");
    table.UpdateTableCell(1, 4, 12);
    cy.get(".bp3-popover-content").should("not.exist");

    // Check for currentRow property on Regex field
    propPane.UpdatePropertyFieldValue("Regex", "{{currentRow.id}}");
    table.EditTableCell(1, 4, 7, false);
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(1, 4, 8);
    cy.get(".bp3-popover-content").contains("Invalid input");
    table.UpdateTableCell(1, 4, 7);
    cy.get(".bp3-popover-content").should("not.exist");
    propPane.UpdatePropertyFieldValue("Regex", "");

    propPane.EnterJSContext("Required", "{{currentIndex == 1}}");
    table.EditTableCell(1, 4, "", false);
    cy.get(".bp3-popover-content").contains("This field is required");
    table.UpdateTableCell(1, 4, 1, true);
    cy.get(".bp3-popover-content").should("not.exist");

    cy.wait(1500);
    cy.discardTableRow(5, 1);
    cy.wait(1500);

    // Value isn't required in Row Index 2
    table.EditTableCell(2, 4, "", false);
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(2, 4, "11");
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(2, 4, "", true);
    cy.get(".bp3-popover-content").should("not.exist");

    cy.wait(1500);
    cy.discardTableRow(5, 2);

    // Check for Required property using currentRow, row with index 1 has id 7
    propPane.UpdatePropertyFieldValue("Required", "{{currentRow.id == 7}}");

    table.EditTableCell(1, 4, "", false);
    cy.get(".bp3-popover-content").contains("This field is required");
    table.UpdateTableCell(1, 4, 1);
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(1, 4, "");
    cy.get(".bp3-popover-content").contains("This field is required");

    table.UpdateTableCell(1, 4, "1", true);
    cy.get(".bp3-popover-content").should("not.exist");

    cy.wait(1500);
    cy.discardTableRow(5, 1);
    cy.wait(1500);

    // Value isn't required in Row Index 2
    table.EditTableCell(2, 4, "", false);
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(2, 4, 10);
    cy.get(".bp3-popover-content").should("not.exist");
    table.UpdateTableCell(2, 4, "", true);
    cy.get(".bp3-popover-content").should("not.exist");

    cy.wait(1500);
    cy.discardTableRow(5, 2);

    // Cleanup
    propPane.UpdatePropertyFieldValue(
      "Computed value",
      '{{currentRow["orderAmount"]}}',
    );
    cy.changeColumnType("Plain text");
    cy.backFromPropertyPanel();
    cy.makeColumnEditable("orderAmount");
  });

  it("5. Verify default prompt message for min field", function () {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("orderAmount");
    cy.editColumn("orderAmount");
    cy.changeColumnType("Number");
    propPane.UpdatePropertyFieldValue("Min", "test");
    cy.get(".t--property-control-min .t--no-binding-prompt > span").should(
      "have.text",
      "Access the current cell using {{currentRow.columnName}}",
    );
    cy.changeColumnType("Plain text");
    cy.backFromPropertyPanel();
    cy.makeColumnEditable("orderAmount");
  });
});
