const dsl = require("../../../fixtures/tableWidgetDsl.json");

describe("Test for Clipboard Copy", function() {
  it(" Clipboard copy on selecting a row ", function() {
    // Add a table widget
    // Click on the Property Pane
    // Naviagte to Action Items
    // Click on "onRow Selection" Dropdown
    // Select "Copy to Clipboard"
    // Add Text to be copied
    // Select a Row from the table
    // Add an Input Widget
    // Now paste the copied text
    // Ensure the text the same as written
  });
  it(" Clipboard copy by adding an action button", function() {
    // Add a table widget
    // Click on the Property Pane
    // Naviagte to Action Items
    // Click on "Add button"
    // Click on the dropdown
    // Select on Copy to Clipboard
    // Add a Text
    // Click on the Action Button
    // Add Input Widget
    // Paste the text into the widget
    // Ensure the text the same as written
  });
  it(" Clipboard copy function by converting it to  JS ", function() {
    // Add a table widget
    // Click on the Property Pane
    // Naviagte to Action Items
    // Click on "Add button"
    // Click on the dropdown
    // Click on the Js Option
    // Add Copy to Clipboard FUNTION
    // Add a Text
    // Click on the Action Button
    // Add Input Widget
    // Paste the text into the widget
    // Ensure the text the same as written
  });
});
