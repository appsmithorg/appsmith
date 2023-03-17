const queryLocators = require("../../../locators/QueryEditor.json");
const queryEditor = require("../../../locators/QueryEditor.json");
let datasourceName;

describe("Binding Datasource to Query", function() {
  it("List of Datasource", function() {
    // Navigate into the Application
    // Click on the '+' next to the Query option
    // Ensure list of  Datasource is dispalyed to user
    // Ensure user is dispalyed with Edit datasource and New Query option
  });

  it("Adding new datasource with respect to query", function() {
    // Navigate into the Application
    // Click on the '+' next to the Query option
    // Click on '+' new datasource
    // Add respective data to establish connection
    // Click on "Test" option
    // Click on "Save" option
  });

  it("Adding an empty datasource", function() {
    // Navigate into the Application
    // Click on the '+' next to the Query option
    // Click on '+' new datasource
    // Click on Test Option
    // Ensure an error message is displayed to user
    // Click on Save option
    // Ensure an empty Datasource is saved
  });

  it("Test for incorrect datasource", function() {
    // Navigate into the Application
    // Click on the '+' next to the Query option
    // Click on '+' new datasource
    // Add incorrect data to establish connection
    // Click on "Test" option
    // Ensure an error is displayed respectively
    // Click on "Save" option
    // Ensure the datasource is still saved
  });
});
