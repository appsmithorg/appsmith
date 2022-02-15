const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Guided Tour", function() {
  it("Guided Tour", function() {
    // Start guided tour
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(guidedTourLocators.welcomeTour).click();
    cy.get(guidedTourLocators.startBuilding).click();
    // Step 1: Update limit in code and run query
    cy.get(".CodeMirror")
      .first()
      .then((editor) => {
        editor[0].CodeMirror.setValue("");
      });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM user_data ORDER BY id LIMIT")
      .type(" 10;", { delay: 600 });
    cy.runQuery();
    cy.get(guidedTourLocators.successButton).click();
    // Step 2: Select table widget
    cy.SearchEntityandOpen("CustomersTable");
    // Step 3: Add binding to the tableData property
    cy.testJsontext("tabledata", "{{getCustomers.data}}");
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
    // Renaming widgets
    cy.wait("@updateWidgetName");
    // Step 4: Add binding to the defaulText property of NameInput
    cy.get(guidedTourLocators.hintButton).click();
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.name}}");
    cy.get(guidedTourLocators.successButton).click();
    // Step 5: Add binding to the rest of the widgets in the container
    cy.get(commonlocators.editWidgetName).contains("EmailInput");
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.email}}");
    cy.get(".t--entity-name")
      .contains("CountryInput")
      .click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.editWidgetName).contains("CountryInput");
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.country}}");
    cy.get(".t--entity-name")
      .contains("ImageWidget")
      .click({ force: true });
    // cy.SearchEntityandOpen("ImageWidget");
    // cy.get(commonlocators.editWidgetName).contains("CountryInput");
    cy.testJsontext("image", "{{CustomersTable.selectedRow.image}}");
    cy.get(guidedTourLocators.successButton).click();
    // Step 6: Drag and drop a widget
    cy.dragAndDropToCanvas("buttonwidget", {
      x: 700,
      y: 400,
    });
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
    // Step 7: Execute a query onClick
    cy.executeDbQuery("updateCustomerInfo");
    // Step 8: Execute getCustomers onSuccess
    cy.get(
      `.t--property-control-onclick [data-guided-tour-iid='onSuccess'] ${commonlocators.dropdownSelectButton}`,
    )
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("Execute a query")
      .click({ force: true })
      .get("ul.bp3-menu")
      .children()
      .contains("getCustomers")
      .click({ force: true });
    cy.get(guidedTourLocators.successButton).click();
    // Step 9: Deploy
    cy.PublishtheApp();
    cy.get(guidedTourLocators.rating)
      .eq(4)
      .click();
    cy.get(guidedTourLocators.startBuilding).click();
  });
});
