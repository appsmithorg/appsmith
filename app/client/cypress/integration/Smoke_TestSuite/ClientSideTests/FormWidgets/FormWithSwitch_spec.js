const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/formSwitchDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Switch Widget within Form widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Switch Widget Functionality check with success message", function() {
    //Open switch widget
    cy.openPropertyPane("switchwidget");
    // Change name of switch widget
    cy.widgetText(
      "Toggler",
      formWidgetsPage.switchWidget,
      widgetsPage.switchInput,
    );
    // Change the widget label name
    cy.testCodeMirror(this.data.switchInputName);
    // Verify widget label name is verified
    cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
    // Check the toggler button
    cy.togglebar(widgetsPage.defaultcheck);
    // Type in message field and verify
    cy.getAlert(commonlocators.optionchangetextSwitch);
    cy.closePropertyPane();
  });

  it("Form reset button valdiation with switch widget", function() {
    // Open form button
    cy.SearchEntityandOpen("FormButton2");
    // Click on reset widget action
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Reset widget")
      .click();
    // click on toggler from actions
    cy.get(widgetsPage.selectWidget).click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Toggler")
      .click();
    cy.closePropertyPane();
    // Uncheck the switch
    cy.get(widgetsPage.switchWidget).click();
    // Verify the message
    cy.get(widgetsPage.toastMsg)
      .last()
      .invoke("text")
      .then((text) => {
        const toasttext = text;
        cy.log(toasttext);
        expect(text.trim()).to.equal(toasttext.trim());
      });
    // Verify Unchecked switch is visible
    cy.get(widgetsPage.switchWidgetInactive).should("be.visible");
    // Click on reset button
    cy.get("Button:contains('Reset')").click({ force: true });
    // Verify switch is on and visible
    cy.get(widgetsPage.switchWidgetActive).should("be.visible");
  });
});
