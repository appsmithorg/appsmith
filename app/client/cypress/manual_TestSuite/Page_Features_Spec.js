const dsl = require("../../../fixtures/pageWidgetDsl.json");

describe("Page functionality ", function() {
  it("Simple Page hide and show back", function() {
    // Add addtional page
    // Navigate to Page 2
    // Click on the Page2 functions (Three dots)
    // Select Hide
    // Click on deploy
    // Ensure the pages are not displayed to user
    // Navigate to Edit mode
    // Click on the Page2 functions (Three dots)
    // Select Show
    // Now Click on deploy
    // Ensure the page is displayed to user
  });

  it("Adding the widgets and hiding the pages ", function() {
    // Add mulitple pages
    // Navigate to Page 3
    // Add multiple widget on the page
    // Navigate to Page2
    // Click on the Page2 functions (Three dots)
    // Select Hide
    // Click on deploy
    // Ensure the pages other then the hidden page is dispalyed
  });

  it("Clone a page and hide the cloned page", function() {
    // Add mulitple pages
    // Navigate to Page 3
    // Add multiple widget on the page
    // Navigate to Page2
    // Click on the Page2 functions (Three dots)
    // Select clone
    // Ensure the clone page is added
    // Click on the clone page functions (Three dots)
    // Select Hide
    // Click on deploy
    // Ensure the the clone page is not displayed and other pages are displayed to user
  });
});
