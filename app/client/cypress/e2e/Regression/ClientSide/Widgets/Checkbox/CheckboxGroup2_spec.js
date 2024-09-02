const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  propPane,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Checkbox Group Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Checkbox"] },
  function () {
    before(() => {
      agHelper.AddDsl("checkboxgroupDsl");
    });

    it("1. Checkbox Group Widget Functionality", function () {
      propPane.RenameWidget("CheckboxGroup1", "CBGTest");
      /**
       * @param{IndexValue} Provide Input Index Value
       * @param{Text} Index Text Value.
       *
       */
      cy.radioInput(0, this.dataSet.radio1);
      cy.get(formWidgetsPage.labelCheckboxGroup)
        .eq(1)
        .should("have.text", "test1");
      cy.radioInput(1, "1");
      cy.radioInput(2, this.dataSet.radio2);
      cy.get(formWidgetsPage.labelCheckboxGroup)
        .eq(2)
        .should("have.text", this.dataSet.radio2);
      cy.radioInput(3, "2");
      agHelper.ClickButton("Add option");
      cy.radioInput(4, this.dataSet.radio4);
      cy.get(formWidgetsPage.deleteradiovalue).eq(2).click({ force: true });
      cy.wait(200);
      cy.get(formWidgetsPage.labelCheckboxGroup).should(
        "not.have.value",
        "test4",
      );
      cy.get(formWidgetsPage.deleteradiovalue).eq(2).click({ force: true });
      cy.wait(200);
      /**
       * @param{Show Alert} Css for InputChange
       */
      cy.getAlert("onSelectionChange");
      cy.get(".t--add-action-onSelectionChange")
        .scrollIntoView()
        .click({ force: true })
        .type("2");
      // cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      //   .get(commonlocators.dropdownSelectButton)
      //   .click({ force: true })
      //   .type("2");
    });

    it("2. Checkbox Group Functionality To Unchecked/Check Visible Widget", function () {
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      cy.get(publish.checkboxGroupWidget + " " + "input").should("not.exist");
      deployMode.NavigateBacktoEditor();
      //Checkbox Group Functionality To Check Visible Widget
      cy.openPropertyPane("checkboxgroupwidget");
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      cy.wait(500);
      cy.get(publish.checkboxGroupWidget + " " + "input")
        .eq(0)
        .should("exist");
      cy.get(publish.checkboxGroupWidget + " " + "label")
        .eq(2)
        .should("have.text", "test2");
      deployMode.NavigateBacktoEditor();
    });

    it("3. handleSelectAllChange: unchecked", function () {
      const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
      const uncheckedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:not(:checked)`;
      // Should get 2 unchecked option inputs
      cy.get(uncheckedOptionInputs).should("have.length", 2);
      //handleSelectAllChange: checked", function () {
      const checkedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:checked`;
      // Select all
      cy.get(selectAllSelector).click();
      // Should get 2 checked option inputs
      cy.get(checkedOptionInputs).should("have.length", 2);
    });

    it("4. Checkbox Group Functionality To alignment options", function () {
      cy.openPropertyPane("checkboxgroupwidget");
      cy.moveToStyleTab();
      // check default value
      cy.get(".t--property-control-alignment").should("exist");
      cy.get(".t--property-control-alignment .rc-select-selector").should(
        "have.text",
        "Please select an option",
      );

      cy.get(
        ".t--draggable-checkboxgroupwidget div[data-testid^='checkbox-group-container']",
      ).should("have.css", "justify-content", "space-between");

      // change alignment
      cy.get(".t--property-control-alignment .rc-select-selector").click({
        force: true,
      });
      cy.wait(200);
      cy.get(".t--dropdown-option").contains("Start").click({ force: true });
      cy.wait(400);
      cy.get(
        ".t--draggable-checkboxgroupwidget div[data-testid^='checkbox-group-container']",
      ).should("have.css", "justify-content", "flex-start");
    });

    it("5. Check isDirty meta property", function () {
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.openPropertyPane("textwidget");
      propPane.UpdatePropertyFieldValue("Text", "{{CBGTest.isDirty}}");
      // Change defaultSelectedValues
      cy.openPropertyPane("checkboxgroupwidget");
      cy.moveToContentTab();
      propPane.UpdatePropertyFieldValue("Default selected values", "GREEN");

      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.get(formWidgetsPage.labelCheckboxGroup).first().click();
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
    });
  },
);
