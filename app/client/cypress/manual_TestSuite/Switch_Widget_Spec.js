const dsl = require("../../../fixtures/switchWidgetDsl.json");

describe("Test to add switch widget in canvas", function() {
  it(" Add a switch widget and bind it to action", function() {
    // Add a switch widget
    // Click on the Property Pane
    // Naviagte to Action Items
    // Click on "onChange" Dropdown
    // Select "Show a message"
    // Add a message
    // now switch the button
    // and observe the message is displyed to user
  });

  it(" Add a switch widget to a form to reset the widget", function() {
    // Add a Form widget
    // Add a switch widget
    // Navigate to Reset button  of the Form
    // Click on the Property Pane
    // Naviagte to Action Items
    // Click on "onChange" Dropdown
    // Select "Reset a widget"
    // Add a widget as "switch widget"
    // Now "Reset Children to Yes "
    // Ensure the Switch is "Flase"
    // now Click on Reset
    // and observe the the button becomes active
  });

  it(" Reset switch widget on date change", function() {
    // Add a Date Picker widget
    // Add a switch widget
    // Click on the Property Pane of Date Picker widget
    // Naviagte to Action Items
    // Click on "on DateSelected" Dropdown
    // Select "Reset a widget"
    // Add a widget as "switch widget"
    // Now "Reset Children to NO "
    // Ensure the Switch is "Flase"
    // now Change the date
    // and observe the the button becomes active
  });
});
