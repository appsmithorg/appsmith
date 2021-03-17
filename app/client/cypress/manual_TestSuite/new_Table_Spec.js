const dsl = require("../../../fixtures/tableWidgetDsl.json");

describe("Table functionality ", function() {
  it("Adding background Colour to table", function() {
    // Add a table
    // Click on the property pane
    // Scroll Styles
    // Add background colour
    // Add Text Colour
    // Navigate to one of the column
    // Click on the setting/ Control pane of the column
    // Navigate to add background colour and Text colour
    // Ensure the row colour gets overlapped on table colour
  });
  it("Collapse the tabs of Property pane", function() {
    // Add a table
    // Click on the property pane
    // Collapse the General ,Action and Tab option
  });
  it("Bind the column with same name", function() {
    // Add a table
    // Click on the property pane
    // Click on the Add new column
    // Ensure to add two new column
    // Name two column with same name
    // Add an input widget
    // Bind the column with new column name
    // Select the row from the binded table
  });

  it("Hide and created custom column ", function() {
    // Add a table
    // Click on the property pane
    // Click on the Add new column
    // Click on Setting of column
    // Select Column Type "Date"
    // Now navigate to exsiting column
    // Click on the hide icon
    // and observe on edit mode the table column is dispalyed
    // Click on deploy
    // Ensure the hidden column is not displayed and custom column is disaplyed to user
  });
});
