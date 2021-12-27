const guidedTourLocators = require("../../../../locators/GuidedTour.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Guided Tour", function() {
  it("Start guided tour", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(guidedTourLocators.welcomeTour).click();
    cy.get(guidedTourLocators.startBuilding).click();
  });

  it("Step 1: Update limit in code and run query", function() {
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
  });

  it("Step 2: Select table widget", function() {
    cy.SearchEntityandOpen("CustomersTable");
  });

  it("Step 3: Add binding to the tableData property", function() {
    cy.testJsontext("tabledata", "{{getCustomers.data}}");
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
  });

  it("Step 4: Add binding to the defaulText property of NameInput", function() {
    cy.get(guidedTourLocators.hintButton).click();
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.name}}");
    cy.get(guidedTourLocators.successButton).click();
  });

  it("Step 5: Add binding to the rest of the widgets in the container", function() {
    cy.get(commonlocators.editWidgetName).contains("EmailInput");
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.email}}");
    cy.SearchEntityandOpen("CountryInput");
    cy.wait(1000);
    cy.get(commonlocators.editWidgetName).contains("CountryInput");
    cy.testJsontext("defaulttext", "{{CustomersTable.selectedRow.country}}");
    cy.SearchEntityandOpen("ImageWidget");
    cy.get(commonlocators.editWidgetName).contains("CountryInput");
    cy.testJsontext("image", "{{CustomersTable.selectedRow.image}}");
    cy.get(guidedTourLocators.successButton).click();
  });

  it("Step 6: Drag and drop a widget", function() {
    cy.dragAndDropToCanvas("buttonwidget", {
      x: 700,
      y: 400,
    });
    cy.get(guidedTourLocators.successButton).click();
    cy.get(guidedTourLocators.infoButton).click();
  });

  it("Step 7: Execute a query onClick", function() {
    cy.executeDbQuery("updateCustomerInfo");
  });

  it("Step 8: Execute getCustomers onSuccess", function() {
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
  });

  it("Step 9: Deploy", function() {
    cy.PublishtheApp();
    cy.get(guidedTourLocators.rating)
      .eq(4)
      .click();
    cy.get(guidedTourLocators.startBuilding).click();
  });
});
