const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "MultiSelectTree Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("TreeSelectDsl");
    });

    it("1. Check isDirty meta property", function () {
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{MultiSelectTree1.isDirty}}`,
      );
      // Change defaultValue
      cy.openPropertyPane("multiselecttreewidget");
      cy.testJsontext("defaultselectedvalues", "GREEN\n");
      // Check if isDirty is set to false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.wait(1000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      cy.treeMultiSelectDropdown("Red");
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Reset isDirty by changing defaultValue
      cy.testJsontext("defaultselectedvalues", "BLUE\n");
      // Check if isDirty is set to false
      cy.get(".t--widget-textwidget").should("contain", "false");
    });

    it("2. Selects value with enter in default value", () => {
      cy.openPropertyPane("multiselecttreewidget");
      cy.testJsontext("defaultselectedvalues", "RED\n");
      cy.get(formWidgetsPage.multiselecttreeWidget)
        .find(".rc-tree-select-selection-item-content")
        .first()
        .should("have.text", "Red");
      // Clear the selected value
      cy.wait(1000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      cy.treeMultiSelectDropdown("Red");
    });

    it("3. Clears the search field when widget is closed", () => {
      // open the multi-tree select widget
      // search for option Red in the search input
      cy.openPropertyPane("multiselecttreewidget");
      cy.testJsontext("defaultselectedvalues", "");
      cy.wait(2000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      cy.get(formWidgetsPage.multiTreeSelectFilterInput)
        .click({ force: true })
        .type("Green");
      // select the Green option
      cy.treeMultiSelectDropdown("Green");
      // Assert the selected value is Green
      cy.get(formWidgetsPage.multiselecttreeWidget)
        .find(".rc-tree-select-selection-item-content")
        .first()
        .should("have.text", "Green");
      // Reopen the multi-tree select widget
      cy.wait(1000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      // Assert if the search input is empty now
      cy.get(formWidgetsPage.multiTreeSelectFilterInput)
        .invoke("val")
        .should("be.empty");
      cy.wait(100);
      cy.testJsontext("defaultselectedvalues", "RED\n");
    });

    it("4. To Validate Options", function () {
      cy.wait(1000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      cy.get(formWidgetsPage.multiTreeSelectFilterInput).click().type("light");
      cy.treeMultiSelectDropdown("Light Blue");
    });

    it("5. To Unchecked Visible Widget", function () {
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      cy.get(
        publish.multiselecttreewidget + " " + ".rc-tree-select-multiple",
      ).should("not.exist");
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. To Check Visible Widget", function () {
      cy.openPropertyPane("multiselecttreewidget");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(
        publish.multiselecttreewidget + " " + ".rc-tree-select-multiple",
      ).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("7. To Check Option Not Found", function () {
      cy.wait(1000)
        .get(formWidgetsPage.treeSelectInput)
        .first()
        .click({ force: true })
        .wait(500);
      cy.get(formWidgetsPage.multiTreeSelectFilterInput).click().type("ABCD");
      cy.get(".tree-multiselect-dropdown .rc-tree-select-empty").contains(
        "No Results Found",
      );
    });

    it("8. Select tooltip renders if tooltip prop is not empty", () => {
      cy.openPropertyPane("multiselecttreewidget");
      // enter tooltip in property pan
      cy.get(widgetsPage.inputTooltipControl).type(
        "Helpful text for tooltip !",
      );
      // tooltip help icon shows
      cy.get(".multitree-select-tooltip").scrollIntoView().should("be.visible");
    });
  },
);
afterEach(() => {
  // put your clean up code if any
});
