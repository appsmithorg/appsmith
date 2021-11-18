const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/SwitchGroupWidgetDsl.json");

describe("Switch Group Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("switchgroupwidget");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });

  it("Widget name changes", function() {
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */

    cy.widgetText(
      "switchgrouptest",
      formWidgetsPage.switchGroupWidget,
      formWidgetsPage.switchGroupInput,
    );
    cy.closePropertyPane();
  });

  it("Property: options", function() {
    // Add a new option
    const optionToAdd = { label: "Yellow", value: "YELLOW" };
    cy.get(".t--property-control-options .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{ctrl}{end}", { force: true })
      .type("{ctrl}{uparrow}", { force: true })
      .type("{end}", { force: true })
      .type(",{enter}")
      .type(JSON.stringify(optionToAdd), {
        parseSpecialCharSequences: false,
      });
    // Assert
    cy.get(formWidgetsPage.labelSwitchGroup)
      .should("have.length", 4)
      .eq(3)
      .contains("Yellow");
    cy.closePropertyPane();
  });

  it("Property: defaultSelectedValues", function() {
    // Add a new option
    const valueToAdd = "GREEN";
    cy.get(".t--property-control-defaultselectedvalues .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("{ctrl}{end}", { force: true })
      .type("{ctrl}{uparrow}", { force: true })
      .type("{end}", { force: true })
      .type(",{enter}")
      .type(`"${valueToAdd}"`);
    // Assert
    cy.get(`${formWidgetsPage.labelSwitchGroup} input:checked`)
      .should("have.length", 2)
      .eq(1)
      .parent()
      .contains("Green");
    cy.closePropertyPane();
  });

  it("Property: isVisible === FALSE", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input").should("not.exist");
  });

  it("Property: isVisible === TRUE", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "input")
      .eq(0)
      .should("exist");
  });

  it("Property: onSelectionChange", function() {
    // create an alert modal and verify its name
    cy.createModal(this.data.ModalName);
    cy.PublishtheApp();
    cy.get(publish.switchGroupWidget + " " + "label.bp3-switch")
      .children()
      .first()
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });
});
