const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/SwitchGroupWidgetDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  propPane = ObjectsRegistry.PropertyPane,
  ee = ObjectsRegistry.EntityExplorer;

describe("Switch Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  /*
  afterEach(() => {
    cy.goToEditFromPublish();
  });
*/
  it("1. Widget name changes", function() {
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    ee.SelectEntityByName("SwitchGroup1");
    agHelper.RenameWidget("SwitchGroup1", "SwitchGroupTest");
  });

  it("2. Property: options", function() {
    // Add a new option
    ee.SelectEntityByName("SwitchGroupTest");

    const optionToAdd = `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      },
      {
        "label": "Yellow",
        "value": "YELLOW"
      }
    ]`;
    propPane.UpdatePropertyFieldValue("Options", optionToAdd);
    // Assert
    cy.get(formWidgetsPage.labelSwitchGroup)
      .should("have.length", 4)
      .eq(3)
      .contains("Yellow");
  });

  it("3. Property: defaultSelectedValues", function() {
    // Add a new option
    const valueToAdd = `[
      "BLUE", "GREEN"
    ]`;
    propPane.UpdatePropertyFieldValue("Default Selected Values", valueToAdd);
    // Assert
    cy.get(`${formWidgetsPage.labelSwitchGroup} input:checked`)
      .should("have.length", 2)
      .eq(1)
      .parent()
      .contains("Green");
  });

  it("4. Property: isVisible === FALSE", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    /*
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input").should("not.exist");
    */
  });

  it("5. Property: isVisible === TRUE", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    /*
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
      */
  });

  it("6. Property: onSelectionChange", function() {
    // create an alert modal and verify its name
    cy.createModal(this.data.ModalName);
    /*
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "label.bp3-switch")
      .children()
      .first()
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
    */
  });

  it("7. Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{SwitchGroupTest.isDirty}}`,
    );
    // Change defaultSelectedValues
    cy.openPropertyPane("switchgroupwidget");
    cy.updateCodeInput(
      ".t--property-control-defaultselectedvalues",
      `[\n"BLUE"\n]`,
    );
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
    cy.wait(200); // Switch group takes time to reflect default value changes
    // Interact with UI
    cy.get(formWidgetsPage.labelSwitchGroup)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultSelectedValues
    cy.openPropertyPane("switchgroupwidget");
    cy.updateCodeInput(
      ".t--property-control-defaultselectedvalues",
      `[\n"GREEN"\n]`,
    );
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });
});
