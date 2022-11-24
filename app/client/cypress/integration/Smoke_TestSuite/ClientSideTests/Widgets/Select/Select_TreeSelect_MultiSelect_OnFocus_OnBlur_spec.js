const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/selectMultiSelectTreeSelectWidgetDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe("Select, MultiSelect, Tree Select and Multi Tree Select Widget Property tests onFocus and onBlur", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. onDropdownOpen and onDropdownClose should be triggered from the select widget", () => {
    cy.openPropertyPane("selectwidget");

    cy.get(widgetsPage.toggleOnDropdownOpen).click({ force: true });
    cy.testJsontext(
      "ondropdownopen",
      "{{showAlert('Select1 dropdown opened', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnDropdownClose).click({ force: true });
    cy.testJsontext(
      "ondropdownclose",
      "{{showAlert('Select1 dropdown closed', 'success')}}",
    );

    cy.get(formWidgetsPage.selectButton).click({ force: true });
    cy.validateToastMessage("Select1 dropdown opened");
    cy.get(formWidgetsPage.selectButton).click({ force: true });
    cy.validateToastMessage("Select1 dropdown closed");
  });

  it("2. onDropdownOpen and onDropdownClose should be triggered from the multiselect widget", () => {
    cy.openPropertyPane("multiselectwidgetv2");

    cy.get(widgetsPage.toggleOnDropdownOpen).click({ force: true });
    cy.testJsontext(
      "ondropdownopen",
      "{{showAlert('MultiSelect1 dropdown opened', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnDropdownClose).click({ force: true });
    cy.testJsontext(
      "ondropdownclose",
      "{{showAlert('MultiSelect1 dropdown closed', 'success')}}",
    );

    cy.get(formWidgetsPage.multiSelect).click({ force: true });
    cy.validateToastMessage("MultiSelect1 dropdown opened");
    cy.get(formWidgetsPage.multiSelect).click({ force: true });
    cy.validateToastMessage("MultiSelect1 dropdown closed");
  });

  it("3. onDropdownOpen and onDropdownClose should be triggered from the treeselect widget", () => {
    cy.openPropertyPane("singleselecttreewidget");

    cy.get(widgetsPage.toggleOnDropdownOpen).click({ force: true });
    cy.testJsontext(
      "ondropdownopen",
      "{{showAlert('TreeSelect1 dropdown opened', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnDropdownClose).click({ force: true });
    cy.testJsontext(
      "ondropdownclose",
      "{{showAlert('TreeSelect1 dropdown closed', 'success')}}",
    );

    cy.get(formWidgetsPage.treeSelect)
      .last()
      .click({ force: true });
    cy.validateToastMessage("TreeSelect1 dropdown opened");
    cy.get(formWidgetsPage.treeSelect)
      .last()
      .click({ force: true });
    cy.validateToastMessage("TreeSelect1 dropdown closed");
  });

  it("4. onDropdownOpen and onDropdownClose should be triggered from the multitreeselect widget", () => {
    cy.openPropertyPane("multiselecttreewidget");

    cy.get(widgetsPage.toggleOnDropdownOpen).click({ force: true });
    cy.testJsontext(
      "ondropdownopen",
      "{{showAlert('MultiTreeSelect1 dropdown opened', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnDropdownClose).click({ force: true });
    cy.testJsontext(
      "ondropdownclose",
      "{{showAlert('MultiTreeSelect1 dropdown closed', 'success')}}",
    );

    cy.get(formWidgetsPage.multiTreeSelect)
      .first()
      .click({ force: true });
    cy.validateToastMessage("MultiTreeSelect1 dropdown opened");
    cy.get(formWidgetsPage.multiTreeSelect)
      .first()
      .click({ force: true });
    cy.validateToastMessage("MultiTreeSelect1 dropdown closed");
  });
});
