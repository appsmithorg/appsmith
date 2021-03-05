const dsl = require("../../../fixtures/ModalWidgetDsl.json");

describe("Modal Functionality ", function() {
  it("Collapse the tabs of Property pane", function() {
    // Add a modal widget from teh entity explorer
    // Click on the property Pane
    // Select Form Type as Modal Type
    // Add any widget on the Modal
    // Add a table
    // Click on the property pane
    // Add a custom column
    // Click on control pane of the column
    // Select Column type as button
    // Add action to "on click"
    // Add Modal
    // Close the modal
    // Click on the Table Action button
    // Ensure the modal pop up
  });

  it("Rename a modal", function() {
    // Click on the entity explore
    // Ensure modal is dispalyed to user
    // Rename the modal
    // Ensure the modal name is replaced in the table
    // Click on the action button
    // Ensure the modal pop up
  });
  it("Convert Modal to ", function() {
    // Click on the entity explore
    // Ensure modal is dispalyed to user
    // Add a button widget
    // Add an "On click" action with modal
    // Click on the button
    // Ensure the Alert modal is dispalyed to user
    // Now click on the Modal in entity explorer
    // Convert the Modal from "Alert" to "Form"
    // Click on the button
    // Ensure a form modal is dispalyed to user
  });
});
