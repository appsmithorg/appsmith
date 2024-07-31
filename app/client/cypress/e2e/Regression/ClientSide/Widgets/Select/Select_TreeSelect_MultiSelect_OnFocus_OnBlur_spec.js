const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Select, MultiSelect, Tree Select and Multi Tree Select Widget Property tests onFocus and onBlur",
  { tags: ["@tag.Widget", "@tag.Select"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("selectMultiSelectTreeSelectWidgetDsl");
    });

    it("1. onDropdownOpen and onDropdownClose should be triggered from the select widget", () => {
      _.propPane.openPropertyPane("selectwidget");

      _.propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('Select1 dropdown opened', 'success')}}",
      );
      _.propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('Select1 dropdown closed', 'success')}}",
      );

      cy.get(formWidgetsPage.selectButton).click({ force: true });
      cy.validateToastMessage("Select1 dropdown opened");
      cy.get(formWidgetsPage.selectButton).click({ force: true });
      cy.validateToastMessage("Select1 dropdown closed");
    });

    it("2. onDropdownOpen and onDropdownClose should be triggered from the multiselect widget", () => {
      _.propPane.openPropertyPane("multiselectwidgetv2");
      _.propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('MultiSelect1 dropdown opened', 'success')}}",
      );
      _.propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('MultiSelect1 dropdown closed', 'success')}}",
      );

      cy.get(formWidgetsPage.multiSelect).first().click({ force: true });
      cy.validateToastMessage("MultiSelect1 dropdown opened");
      cy.get(formWidgetsPage.multiSelect).first().click({ force: true });
      cy.validateToastMessage("MultiSelect1 dropdown closed");
    });

    it("3. onDropdownOpen and onDropdownClose should be triggered from the treeselect widget", () => {
      _.propPane.openPropertyPane("singleselecttreewidget");
      _.propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('TreeSelect1 dropdown opened', 'success')}}",
      );
      _.propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('TreeSelect1 dropdown closed', 'success')}}",
      );

      cy.wait(500);
      cy.get(formWidgetsPage.treeSelect).first().click({ force: true });
      cy.validateToastMessage("TreeSelect1 dropdown opened");
      cy.get(formWidgetsPage.treeSelect).first().click({ force: true });
      cy.validateToastMessage("TreeSelect1 dropdown closed");
    });

    it("4. onDropdownOpen and onDropdownClose should be triggered from the multitreeselect widget", () => {
      _.propPane.openPropertyPane("multiselecttreewidget");

      _.propPane.EnterJSContext(
        "onDropdownOpen",
        "{{showAlert('MultiTreeSelect1 dropdown opened', 'success')}}",
      );
      _.propPane.EnterJSContext(
        "onDropdownClose",
        "{{showAlert('MultiTreeSelect1 dropdown closed', 'success')}}",
      );

      cy.wait(500);
      cy.get(formWidgetsPage.multiTreeSelect).last().click({ force: true });
      cy.validateToastMessage("MultiTreeSelect1 dropdown opened");
      cy.get(formWidgetsPage.multiTreeSelect).last().click({ force: true });
      cy.validateToastMessage("MultiTreeSelect1 dropdown closed");
    });
  },
);
