const explorer = require("../../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../../locators/Widgets.json");

describe("Select widget", () => {
  it("1. Drag and drop Select/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
    cy.get(formWidgetsPage.selectWidget).should("exist");
  });

  it("2. Check isDirty meta property", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.updateCodeInput(".t--property-control-text", `{{Select1.isDirty}}`);
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Blue")
      .click({ force: true });
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultOptionValue property
    cy.updateCodeInput(".t--property-control-defaultvalue", "RED");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });

  it("3. Clears the search field when widget is closed and serverSideFiltering is off", () => {
    // open the select widget
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    // search for option Red in the search input
    cy.get(commonlocators.selectInputSearch).type("Red");
    // Select the Red option from dropdown list
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Red")
      .click({ force: true });
    cy.wait(200);
    // Assert if the select widget has Red as the selected value
    cy.get(formWidgetsPage.selectWidget).contains("Red");
    // Open the select widget again
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    // Assert if the search input is empty now
    cy.get(commonlocators.selectInputSearch)
      .invoke("val")
      .should("be.empty");
  });

  it("4. Does not clear the search field when widget is closed and serverSideFiltering is on", () => {
    // toggle the serversidefiltering option on
    cy.togglebar(
      '.t--property-control-serversidefiltering input[type="checkbox"]',
    );
    // open the select widget
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    // search for option Red in the search input
    cy.get(commonlocators.selectInputSearch).type("Red");
    // Select the Red option from dropdown list
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Red")
      .click({ force: true });
    cy.wait(200);
    // Open the select widget again
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    // Assert if the search input is not empty
    cy.get(commonlocators.selectInputSearch)
      .invoke("val")
      .should("not.be.empty");
  });
});
