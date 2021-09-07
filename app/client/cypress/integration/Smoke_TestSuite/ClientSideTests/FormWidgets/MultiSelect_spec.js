const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/multiSelectDsl.json");
const pages = require("../../../../locators/Pages.json");
const data = require("../../../../fixtures/example.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.openPropertyPane("multiselectwidget");
  });
  it("MultiSelect Functionality To Validate Placeholder", function() {
    cy.testJsontext("placeholder", this.data.placeholder);
    cy.get(
      formWidgetsPage.multiselectWidget +
        " " +
        ".rc-select-selection-placeholder",
    ).should("contain", this.data.placeholder);
    cy.PublishtheApp();
    cy.get(
      publish.multiselectwidget + " " + ".rc-select-selection-placeholder",
    ).should("contain", this.data.placeholder);
  });
  it("Verify Multiselect Icon is available", function() {
    cy.PublishtheApp();
    cy.get(formWidgetsPage.multiSelectArrow).should("be.visible");
  });
  it("Multiselect Close Verification", function() {
    // Close propert pane
    cy.closePropertyPane();
    cy.get(widgetsPage.propertypaneText).should("not.exist");
    cy.PublishtheApp();
  });
  it("Copy paste Multiselect widget", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.testJsontext("options", JSON.stringify(data.input));
    cy.widgetText(
      "MultiSelectTest",
      formWidgetsPage.multiselectWidget,
      formWidgetsPage.PropertyTitleName,
    );
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");
    cy.closePropertyPane();
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastAction).should("be.visible");
    //Check after copying new table widget should not have any warnings
    cy.get('.t--draggable-multiselectwidget [name="warning"]').should(
      "not.exist",
    );
    cy.GlobalSearchEntity("MultiSelectTestCopy");
  });
  it("Multiselect-Delete Verification", function() {
    cy.closePropertyPane();
    // Open property pane
    cy.SearchEntityandOpen("MultiSelectTestCopy");
    // Delete the MultiSelect widget
    cy.deleteWidget(formWidgetsPage.multiSelectWidget);
    cy.PublishtheApp();
    // Verify the MultiSelect widget is deleted
    cy.get(formWidgetsPage.multiSelectWidget).should("not.exist");
  });
  it("MultiSelects value with invalid default value", () => {
    cy.testJsontext("defaultvalue", "{{ undefined }}");
    cy.get(formWidgetsPage.multiselectWidget)
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
    cy.PublishtheApp();
  });
  it("MultiSelects value with enter in default value", () => {
    cy.testJsontext("defaultvalue", "3\n");
    cy.get(formWidgetsPage.multiselectWidget)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Option 3");
    cy.PublishtheApp();
  });
  it("MultiSelect Functionality To Validate Options", function() {
    cy.get(formWidgetsPage.mulitiselectInput).click({ force: true });
    cy.get(formWidgetsPage.mulitiselectInput).type("Option");
    cy.dropdownMultiSelectDynamic("Option 3");
    cy.PublishtheApp();
  });
  it("MultiSelect-Disable Validation", function() {
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateDisableWidget(
      formWidgetsPage.multiselectWidget,
      commonlocators.disabledFieldForMultiSelect,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publish.multiselectwidget,
      commonlocators.disabledFieldForMultiSelect,
    );
  });
  it("MultiSelect-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateEnableWidget(
      formWidgetsPage.multiselectWidget,
      commonlocators.disabledFieldForMultiSelect,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publish.multiselectwidget,
      commonlocators.disabledFieldForMultiSelect,
    );
  });

  it("Toggle JS - MultiSelect-Disable Validation", function() {
    //Check the disabled checkbox by using JS widget and Validate
    cy.get(widgetsPage.toggleDisable).click({ force: true });
    cy.testJsontext("disabled", "true");
    cy.validateDisableWidget(
      formWidgetsPage.multiSelectWidget,
      commonlocators.disabledFieldForMultiSelect,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publish.multiselectwidget,
      commonlocators.disabledFieldForMultiSelect,
    );
  });
  it("Toggle JS - MultiSelect-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.testJsontext("disabled", "false");
    cy.validateEnableWidget(
      formWidgetsPage.multiselectWidget,
      commonlocators.disabledFieldForMultiSelect,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publish.multiselectWidget,
      commonlocators.disabledFieldForMultiSelect,
    );
  });
  it("MultiSelect Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidget + " " + ".rc-select-selector").should(
      "not.exist",
    );
  });
  it("MultiSelect Functionality To Check Visible Widget", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.multiselectwidget + " " + ".rc-select-selector").should(
      "be.visible",
    );
  });
  it("Toggle JS - Multiselect-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(formWidgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(publish.multiselectwidget).should("not.exist");
  });
  it("Toggle JS - Multiselect-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publish.multiselectwidget).should("be.visible");
  });
});
afterEach(() => {
  // put your clean up code if any
  cy.goToEditFromPublish();
});
