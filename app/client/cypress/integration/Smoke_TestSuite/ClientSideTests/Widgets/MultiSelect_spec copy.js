const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/multiSelectDsl.json");
const pages = require("../../../../locators/Pages.json");
const data = require("../../../../fixtures/example.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Selects value with invalid default value", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.testJsontext("options", JSON.stringify(data.input));
    cy.testJsontext("defaultvalue", "{{ undefined }}");
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    cy.get(".multi-select-dropdown")
      .contains("Option 3")
      .click({ force: true });
    cy.wait(2000);
    //Validating option inside multiselect widget
    cy.get(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Option 3");
  });

  it("2. Clears the search field when widget is closed and serverSideFiltering is off", () => {
    // Turn on the filterable for the widget
    cy.togglebar('.t--property-control-filterable input[type="checkbox"]');
    // open the widget
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    // Search for Option 2 in the search input
    cy.get(".rc-select-dropdown input[type='text']")
      .click()
      .type("Option 2");
    // Select Option 2
    cy.get(".multi-select-dropdown")
      .contains("Option 2")
      .click({ force: true });
    // Assert Option 2 is selected
    cy.get(".rc-select-selection-item-content")
      .eq(1)
      .should("have.text", "Option 2");
    // Close the widget
    cy.openPropertyPane("multiselectwidgetv2");
    // Reopen the widget
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    // Assert if the search input is empty
    cy.get(".rc-select-dropdown input[type='text']")
      .invoke("val")
      .should("be.empty");
  });

  it("3. Does not clear the search field when widget is closed and serverSideFiltering is on", () => {
    // Turn on server side filtering for the widget
    cy.togglebar(
      '.t--property-control-serversidefiltering input[type="checkbox"]',
    );
    // open the widget
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    // Search for Option 2 in the search input
    cy.get(".rc-select-dropdown input[type='text']")
      .click()
      .type("Option 2");
    // Click on Option 2
    cy.get(".multi-select-dropdown")
      .contains("Option 2")
      .click({ force: true });
    // Close the widget
    cy.openPropertyPane("multiselectwidgetv2");
    // Reopen the widget
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    // Assert if the search input is not empty
    cy.get(".rc-select-dropdown input[type='text']")
      .invoke("val")
      .should("not.be.empty");
    // Turn off the filterable property for the widget
    cy.togglebarDisable(
      '.t--property-control-filterable input[type="checkbox"]',
    );
    // Turn off server side filtering for the widget
    cy.togglebarDisable(
      '.t--property-control-serversidefiltering input[type="checkbox"]',
    );
  });

  it("4. Dropdown Functionality To Check Allow select all option", function() {
    // select all option is not enable
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("not.have.text", "Select all");
    // enable select all option from property pane
    cy.openPropertyPane("multiselectwidgetv2");
    cy.togglebar(commonlocators.allowSelectAllCheckbox);

    // press select all option
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    cy.get(".multi-select-dropdown")
      .contains("Select all")
      .click({ force: true });
    cy.wait(2000);
    //Validating option inside multiselect widget
    cy.get(".rc-select-selection-item-content")
      .eq(0)
      .should("have.text", "Option 1");
    cy.get(".rc-select-selection-item-content")
      .eq(1)
      .should("have.text", "Option 2");
  });

  it("5. Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{MultiSelect2.isDirty}}`);
    // Init isDirty by changing defaultOptionValue
    cy.openPropertyPane("multiselectwidgetv2");
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      '[\n  {\n    "label": "Option 1",\n    "value": "1"\n  }\n]',
    );
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(".rc-select-selector").click({ force: true });
    cy.dropdownMultiSelectDynamic("Option 2");
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Reset isDirty by changing defaultOptionValue
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      '[\n  {\n    "label": "Option 2",\n    "value": "2"\n  }\n]',
    );
    // Check if isDirty is set to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });

  it("6. Selects value with enter in default value", () => {
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      '[\n  {\n    "label": "Option 3",\n    "value": "3"\n  }\n]',
    );
    cy.wait(200);
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Option 3");
  });

  it("7. Dropdown Functionality To Validate Options", function() {
    cy.get(".rc-select-selector").click({ force: true });
    cy.dropdownMultiSelectDynamic("Option 2");
  });

  it("8. Dropdown Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
      "not.exist",
    );
    cy.get(publish.backToEditor).click();
  });

  it("9. Dropdown Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidgetv2 + " " + ".rc-select-selector").should(
      "be.visible",
    );
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
