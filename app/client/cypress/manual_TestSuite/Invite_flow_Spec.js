const homePage = require("../../../locators/HomePage.json");

describe("adding role without Email Id", function() {
  it("Empty Email ID Invite flow", function() {
    // Navigate to Home Page
    // Click on "Share" option
    // Add Role from the dropdown
    // Ensure the "Invite" option is "Inactive"
  });
  it("Error message must be dispalyed to user on inappropriate Email ID", function() {
    // Navigate to Home Page
    // Click on "Share" option
    // Add inappropriate Email Id
    // Select the "Role"
    // Ensure the "Invite" option is "Inactive" and error message is displayed to user
  });
  it("Clicking on the organisation list the user must be lead to organisation Station ", function() {
    // Navigate to Home Page
    // Navigate to Organisation list
    // Click on one of the organisation name
    // Ensure user is directed to the organisation
  });
  it("Admin can only assign another Admin ", function() {
    // Navigate to Organisation Setting
    // Navigate to Members
    // Navigate to roles
    // Ensure your also an "Admin"
    // Change the role "Admin"
  });
  it("Ensure the user can not delete or create an application in the organisation", function() {
    // Navigate to Home page
    // Navigate to Members
    // Navigate to roles
    // Ensure role is "App Viewer"
    // Ensure user is not able to  delete or add any user for the application
  });
  it("Ensure On invalid Email Id the box must get highlighted", function() {
    // Navigate to Home page
    // Click on the Share option
    // Ensure the pop up opens
    // Enter an Invaild Email Id
    // and ensure the Email ID box is highlight
  });
});
