import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";

const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../../support/Objects/ObjectsCore";
const widgetLocators = require("../../../../../../locators/Widgets.json");

const items = JSON.parse(dsl.dsl.children[0].listData);

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const widgetSelectorByType = (name) => `.t--widget-${name}`;

describe("Select Widgets", { tags: ["@tag.Widget", "@tag.List"] }, function () {
  before(() => {
    _.agHelper.AddDsl("Listv2/simpleLargeListv2");
  });

  it("1. Select Widgets default value", function () {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 500, 100); //for test #2
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.MULTISELECT,
      200,
      150,
    );

    _.propPane.ToggleJSMode("sourcedata");

    _.propPane.UpdatePropertyFieldValue(
      "Source Data",
      `{{[{
      label: currentItem.name,
      value: currentItem.id
  }]}}`,
    );

    _.propPane.ToggleJSMode("label key");
    cy.updateCodeInput(
      ".t--property-control-wrapper.t--property-control-labelkey",
      `label`,
    );

    _.propPane.ToggleJSMode("value key");
    cy.updateCodeInput(".t--property-control-valuekey", `value`);

    _.propPane.UpdatePropertyFieldValue(
      "Default selected values",
      "{{currentItem.id}}",
    );
    _.propPane.TogglePropertyState("Required", "On");
    _.propPane.EnterJSContext(
      "onOptionChange",
      "{{showAlert('Row ' + currentIndex + ' Option Changed')}}",
    );

    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 500, 300); //for test #2
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.SELECT, 200, 350);

    _.propPane.ToggleJSMode("sourcedata");

    _.propPane.UpdatePropertyFieldValue(
      "Source Data",
      `{{[{
        label: currentItem.name,
        value: currentItem.id
    }]}}`,
    );

    _.propPane.ToggleJSMode("label key");
    cy.updateCodeInput(
      ".t--property-control-wrapper.t--property-control-labelkey",
      `label`,
    );

    _.propPane.ToggleJSMode("value key");
    cy.updateCodeInput(".t--property-control-valuekey", `value`);

    _.propPane.UpdatePropertyFieldValue(
      "Default selected value",
      "{{currentItem.id}}",
    );
    _.propPane.TogglePropertyState("Required", "On");
    _.propPane.EnterJSContext(
      "onOptionChange",
      "{{showAlert('Row ' + currentIndex + ' Option Changed')}}",
    );

    // Page 1
    _.agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq(items[0].name);
    });
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", items[0].name);

    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    _.agHelper.Sleep();

    // Page 2
    _.agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
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

  it("2. Select Widgets isValid", function () {
    // Test for isValid === True
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
    _.propPane.RenameWidget("Text1", "MultiSelect_Widget");
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{`${currentView.MultiSelect1.selectedOptionLabels[0]}_${currentView.MultiSelect1.selectedOptionValues[0]}_${currentView.MultiSelect1.isDirty}_${currentView.MultiSelect1.isValid}`}}",
    );
    cy.get(
      `${widgetSelector("MultiSelect_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", `${items[0].name}_${items[0].id}_false_true`);

    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    _.propPane.RenameWidget("Text2", "Select_Widget");
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{`${currentView.Select1.selectedOptionLabel}_${currentView.Select1.selectedOptionValue}_${currentView.Select1.isDirty}_${currentView.Select1.isValid}`}}",
    );
    cy.get(`${widgetSelector("Select_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `${items[0].name}_${items[0].id}_false_true`);

    // Test for isValid === false
    EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);
    _.agHelper.SelectFromMultiSelect([`${items[0].name}`], 0, false);
    cy.get(
      `${widgetSelector("MultiSelect_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", `undefined_undefined_true_false`);

    cy.get(_.locators._selectClearButton_dataTestId).should("not.exist");
  });

  it("3. Select Widgets onOptionChange", function () {
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
