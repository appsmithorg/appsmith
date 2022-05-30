import homePage from "../../../locators/HomePage";

describe("Checking for error message on Workspace Name ", function() {
  it("Ensure of Inactive Submit button ", function() {
    // Navigate to home Page
    // Click on Create workspace
    // Type "Space" as first character
    // Ensure "Submit" button does not get Active
    // Now click on "X" (Close icon) ensure the pop up closes
  });
  it("Reuse the name of the deleted application name ", function() {
    // Navigate to home Page
    // Create an Application by name "XYZ"
    // Add some widgets
    // Navigate back to the application
    // Delete the Application
    // Click on "Create New" option under same workspace
    // Enter the name "XYZ"
    // Ensure the application can be created with the same name
  });
  it("Adding Special Character ", function() {
    // Navigate to home Page
    // Click on Create workspace
    // Add special as first character
    // Ensure "Submit" get Active
    // Now click outside and ensure the pop up closes
  });
  it("Reuse the name of the deleted application name on the other workspace", function() {
    // Navigate to home Page
    // Create an Application by name "XYZ"
    // Add some widgets
    // Navigate back to the application
    // Delete the Application
    // Click on "Create New" option under different workspace
    // Enter the name "XYZ"
    // Ensure the application can be created with the same name
  });
  it("User must not be able to add empty workspace name", function() {
    // Navigate to home Page
    // Click on the "Create Workspace" button
    // Ensure "Workspace Name" field is empty
    // Ensure "Submit" is inactive
  });

  it("Cancel creating an Workspace when the Workspace name is empty", function() {
    // Navigate to home Page
    // Click on the "Create Workspace" button
    // Ensure "Workspace Name" field is empty
    // Click on "Cancel" option
    // Observe the workspace is not created
  });

  it("Cancel creating an Workspace when the Workspace name is dually filled", function() {
    // Navigate to home Page
    // Click on the "Create Workspace" button
    // Ensure "Workspace Name" field is enterd respectively
    // Click on "Cancel" option
    // Observe the workspace is not created
  });
});
