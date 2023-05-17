const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../../locators/FormWidgets.json");
import { ObjectsRegistry } from "../../../../../../support/Objects/Registry";
const widgetLocators = require("../../../../../../locators/Widgets.json");

let agHelper = ObjectsRegistry.AggregateHelper;

const items = JSON.parse(dsl.dsl.children[0].listData);

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const widgetSelectorByType = (name) => `.t--widget-${name}`;
const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe("Select Widgets", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("a. Select Widgets default value", function () {
    cy.dragAndDropToWidget("multiselectwidgetv2", "listwidgetv2", {
      x: 150,
      y: 50,
    });
    cy.dragAndDropToWidget("selectwidget", "listwidgetv2", {
      x: 150,
      y: 120,
    });
    cy.openPropertyPane("multiselectwidgetv2");
    cy.updateCodeInput(
      ".t--property-control-options",
      `{{[{
              label: currentItem.name,
              value: currentItem.id
          }]}}`,
    );
    cy.updateCodeInput(
      ".t--property-control-defaultselectedvalues",
      `{{currentItem.id}}`,
    );
    cy.togglebar(commonlocators.requiredCheckbox);
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });
    cy.testJsontext(
      "onoptionchange",
      `{{showAlert('Row ' + currentIndex + ' Option Changed')}}`,
    );

    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `{{[{
              label: currentItem.name,
              value: currentItem.id
          }]}}`,
    );
    cy.updateCodeInput(
      ".t--property-control-defaultselectedvalue",
      `{{currentItem.id}}`,
    );
    cy.togglebar(commonlocators.requiredCheckbox);
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });
    cy.testJsontext(
      "onoptionchange",
      `{{showAlert('Row ' + currentIndex + ' Option Changed')}}`,
    );

    // Page 1
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq(items[0].name);
    });
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", items[0].name);

    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    agHelper.Sleep();

    // Page 2
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq(items[1].name);
    });

    cy.get(`.rc-select-selection-item[title="${items[1].name}"]`).should(
      "have.text",
      items[1].name,
    );

    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });
  });
  it("b. Select Widgets isValid", function () {
    // Test for isValid === True
    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 550,
      y: 50,
    });

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "Select_Widget");

    cy.testJsontext(
      "text",
      "{{`${currentView.Select1.selectedOptionLabel}_${currentView.Select1.selectedOptionValue}_${currentView.Select1.isDirty}_${currentView.Select1.isValid}`}}",
    );
    cy.get(`${widgetSelector("Select_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `${items[0].name}_${items[0].id}_false_true`);

    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 550,
      y: 120,
    });

    cy.RenameWidgetFromPropertyPane(
      "textwidget",
      "Text1",
      "MultiSelect_Widget",
    );
    cy.testJsontext(
      "text",
      "{{`${currentView.MultiSelect1.selectedOptionLabels[0]}_${currentView.MultiSelect1.selectedOptionValues[0]}_${currentView.MultiSelect1.isDirty}_${currentView.MultiSelect1.isValid}`}}",
    );
    cy.get(
      `${widgetSelector("MultiSelect_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", `${items[0].name}_${items[0].id}_false_true`);

    // Test for isValid === false
    agHelper.RemoveMultiSelectItems([`${items[0].name}`]);
    cy.get(
      `${widgetSelector("MultiSelect_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", `undefined_undefined_true_false`);

    cy.get(`${widgetSelectorByType("selectwidget")} .cancel-icon`).click({
      force: true,
    });
    cy.get(`${widgetSelector("Select_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `__true_false`);
  });
  it("c. Select Widgets onOptionChange", function () {
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains(items[0].name)
      .click({ force: true });
    cy.wait(200);

    cy.get(formWidgetsPage.selectWidget).contains(items[0].name);
    cy.validateToastMessage("Row 0 Option Changed");

    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });

    cy.get(".multi-select-dropdown")
      .contains(items[0].name)
      .click({ force: true });
    cy.get(`.rc-select-selection-item[title="${items[0].name}"]`).should(
      "have.text",
      items[0].name,
    );
    cy.validateToastMessage("Row 0 Option Changed");
  });
});
