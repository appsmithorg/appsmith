const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/selectMultiSelectTreeSelectWidgetDsl.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe("Select, MultiSelect, Tree Select and Multi Tree Select Widget Property tests onFocus and onBlur", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("onBlur and onFocus should be triggered from the select widget", () => {
    cy.openPropertyPane("selectwidget");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext("onfocus", "{{showAlert('Select1 focused', 'success')}}");
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext("onblur", "{{showAlert('Select1 blurred', 'success')}}");

    cy.get(formWidgetsPage.selectButton).click({ force: true });
    cy.validateToastMessage("Select1 focused");
    cy.wait(5000);
    cy.get(formWidgetsPage.selectButton).click({ force: true });
    cy.validateToastMessage("Select1 blurred");
  });

  it("onBlur and onFocus should be triggered from the multiselect widget", () => {
    cy.openPropertyPane("multiselectwidgetv2");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext(
      "onfocus",
      "{{showAlert('MultiSelect1 focused', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext(
      "onblur",
      "{{showAlert('MultiSelect1 blurred', 'success')}}",
    );

    cy.get(formWidgetsPage.multiSelect).click({ force: true });
    cy.validateToastMessage("MultiSelect1 focused");
    cy.wait(5000);
    cy.get(formWidgetsPage.multiSelect).click({ force: true });
    cy.validateToastMessage("MultiSelect1 blurred");
  });

  it("onBlur and onFocus should be triggered from the treeselect widget", () => {
    cy.openPropertyPane("singleselecttreewidget");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext(
      "onfocus",
      "{{showAlert('TreeSelect1 focused', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext(
      "onblur",
      "{{showAlert('TreeSelect1 blurred', 'success')}}",
    );

    cy.get(formWidgetsPage.treeSelect)
      .last()
      .click({ force: true });
    cy.validateToastMessage("TreeSelect1 focused");
    cy.wait(5000);
    cy.get(formWidgetsPage.treeSelect)
      .last()
      .click({ force: true });
    cy.validateToastMessage("TreeSelect1 blurred");
  });

  it("onBlur and onFocus should be triggered from the multitreeselect widget", () => {
    cy.openPropertyPane("multiselecttreewidget");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext(
      "onfocus",
      "{{showAlert('MultiTreeSelect1 focused', 'success')}}",
    );
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext(
      "onblur",
      "{{showAlert('MultiTreeSelect1 blurred', 'success')}}",
    );

    cy.get(formWidgetsPage.multiTreeSelect)
      .first()
      .click({ force: true });
    cy.validateToastMessage("MultiTreeSelect1 focused");
    cy.wait(5000);
    cy.get(formWidgetsPage.multiTreeSelect)
      .first()
      .click({ force: true });
    cy.validateToastMessage("MultiTreeSelect1 blurred");
  });
});
