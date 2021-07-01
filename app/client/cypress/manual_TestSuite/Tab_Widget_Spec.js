const dsl = require("../../../fixtures/TabWidgetDsl.json");

describe("Tab widget", function() {
  it("Movement of tabs inside Tab widget ", function() {
    // Drag and drop the Tab widget
    // click on "Add a Tab"
    // Add multiple Tabs
    // Hold and move the Tab
    // and observe if the tab are moved in the same
  });

  it(" Deletion of Tabs and adding them back with Undo", function() {
    // Drag and drop the Tab widget
    // click on "Add a Tab"
    // Add multiple Tabs
    // Click on delete option of the Tab
    // ensure the tab is deleted
    // Click on delete option of the Tab
    // Ensure an info message is dispalyed to user
    // Now click on "UNDO"
    //and observe that the Tab is added back
  });

  it("Test Ideas for testing the Visible option for tabs ", function() {
    // Drag and drop the Tab widget
    // click on "Add a Tab"
    // Click on Property pane of the tab widget
    // Click on the Control Pane of the tab
    // Now click on JS option
    // Now add it false
    // and observe the Tab is blured on edit Mode
    // Now click on Deploy
    // Observe the tab is not dispalyed to user
    // Now come back to Edit mode
    // Click on the Control Pane of the tab
    // Now click on JS option
    // enable the  button
    // Now observe the Tab must be visible and normal
  });

  it("Test Ideas for testing the Show Tabs Feature ", function() {
    // Drag and drop the Tab widget
    // Click on Property pane of the tab widget
    // Scroll down to Show Tabs option
    // Now click on JS option
    // Now add it false
    // and observe the Tab widget does not show any Tabs
    // Now click on Deploy
    // Observe the Tab widget does not show any Tabs
    // Now come back to Edit mode
    // Now click on JS option
    // enable the button
    // Now observe the Tab must be visible
  });

  it("Adding multiple widgets inside the Tab widget", function() {
    // Drag and drop the Tab widget
    // Ensure default 2 Tabs are dispalyed to user
    // Add date picker, Text and Button into Tab1
    // Click on Tab2 and ensure it is empty
    // Add image widget , radio, Check widget
    // Click on Deploy
    // Ensure the Tab widget with widgets are displayed to user
  });

  it("Adding action while changing the Tab ", function() {
    // Drag and drop the Tab widget
    // Click on Property pane of the tab widget
    // Navigate to Action section
    // Select "Show a modal"
    // Click on "Add a Modal"
    // Assign related action on the modal
    // Now change the tab
    // and observe the modal pop up is displayed to user
  });

  it("Binding the Tab to widget ", function() {
    // Drag and drop the Tab widget
    // Click on Property pane of the tab widget
    // Navigate to control pane
    // Convert a Visible option to JS
    // Add binding to the widget
    // Ensure user is dispalyed on the TAB widget
  });
});
