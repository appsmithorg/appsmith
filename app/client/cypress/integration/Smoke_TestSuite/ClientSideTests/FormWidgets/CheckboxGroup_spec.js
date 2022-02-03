const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/checkboxgroupDsl.json");

describe("Checkbox Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Checkbox Group Functionality", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    cy.widgetText(
      "checkboxgrouptest",
      formWidgetsPage.checkboxGroupWidget,
      formWidgetsPage.checkboxGroupInput,
    );

    // Add a new option
    const optionToAdd = {
      label: "Yellow",
      value: "YELLOW",
    };
    cy.get(".t--property-control-options .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{ctrl}{end}", {
        force: true,
      })
      .type("{ctrl}{uparrow}", { force: true })
      .type("{end}", {
        force: true,
      })
      .type(",{enter}")
      .type(JSON.stringify(optionToAdd), {
        parseSpecialCharSequences: false,
      });
    // Assert
    cy.get(formWidgetsPage.labelCheckboxGroup)
      .should("have.length", 5)
      .eq(4)
      .contains("Yellow");

    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangeRadioselect);
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .type("2");
    cy.PublishtheApp();
  });

  it("2. Checkbox Group Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("3. Checkbox Group Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.checkboxGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });

  it("4. Checkbox Group Functionality To Button Text", function() {
    cy.get(publish.checkboxGroupWidget + " " + "label")
      .eq(3)
      .should("have.text", "Red");
    cy.get(publish.backToEditor).click();
  });

  it("handleSelectAllChange: unchecked", function() {
    const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
    const uncheckedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:not(:checked)`;
    // Deselect all
    cy.get(selectAllSelector).click();
    // Should get 4 unchecked option inputs
    cy.get(uncheckedOptionInputs).should("have.length", 4);
  });

  it("handleSelectAllChange: checked", function() {
    const selectAllSelector = formWidgetsPage.selectAllCheckboxControl;
    const checkedOptionInputs = `${formWidgetsPage.checkboxGroupOptionInputs} input:checked`;
    // Select all
    cy.get(selectAllSelector).click();
    // Should get 4 checked option inputs
    cy.get(checkedOptionInputs).should("have.length", 4);
  });

  it("Checkbox Group Functionality To alignment options", function() {
    cy.openPropertyPane("checkboxgroupwidget");
    // check default value
    cy.get(".t--property-control-alignment").should("exist");
    cy.get(".t--property-control-alignment span[type='p1']").should(
      "have.text",
      "No selection.",
    );

    cy.get(
      ".t--draggable-checkboxgroupwidget div[data-cy^='checkbox-group-container']",
    ).should("have.css", "justify-content", "space-between");

    // change alignment
    cy.get(".t--property-control-alignment span[type='p1']").click({
      force: true,
    });
    cy.wait(200);
    cy.get(".t--dropdown-option")
      .contains("Start")
      .click({ force: true });
    cy.wait(400);
    cy.get(
      ".t--draggable-checkboxgroupwidget div[data-cy^='checkbox-group-container']",
    ).should("have.css", "justify-content", "flex-start");
  });
});
afterEach(() => {
  // put your clean up code if any
});
