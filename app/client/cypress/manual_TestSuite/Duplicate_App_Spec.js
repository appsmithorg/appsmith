const homePage = require("../../../locators/HomePage.json");

describe("Duplicate an application must duplicate every API ,Query widget and Datasource", function() {
  it("Duplicating an application", function() {
    // Navigate to home Page
    // Click on any application action icon (Three dots)
    // Click on "Duplicate" option
    // Ensure the application gets copied
    // Ensure the name is appended with the word "Copy"
  });
  it("Deleting the duplicated Application ", function() {
    // Navigate to home Page
    // Click on any application action icon (Three dots)
    // Click on "Duplicate" option
    // Ensure the application gets copied
    // Click on "Appsmith" to navigate to homepage
    // Click  on action icon
    // Click on Delete option
    // Click on "Are You Sure?" option
    // Ensure  the App gets deleted
  });

  it(" Ensure only the original application is deleted  and copy of it exists", function() {
    // Navigate to home Page
    // Create an Application
    // Add a name to the application
    // Navigate to home page
    // Now click on the action (Three Dots)
    // Select "Duplicate" option
    // Ensure App is created with App name prefixed with Copy
    // Click on Delete option of Original Application
    // Click on "Are You Sure?" option
    // Ensure only Original Application is deleted and not the child application
  });

  it(" Ensure only the Duplicate application is deleted  and original Application of it exists", function() {
    // Navigate to home Page
    // Create an Application
    // Add a name to the application
    // Navigate to home page
    // Now click on the action (Three Dots)
    // Select "Duplicate" option
    // Ensure App is created with App name prefixed with Copy
    // Click on Delete option of Duplicate Application
    // Click on "Are You Sure?" option
    // Ensure only Duplicate Application is deleted and not the Orginal application
  });
});
