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
    cy.openPropertyPane("switchwidget");
    cy.widgetText(
      "Toggler",
      formWidgetsPage.switchWidget,
      widgetsPage.switchInput,
    );
    cy.testCodeMirror(this.data.switchInputName);
    cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
    cy.togglebar(widgetsPage.defaultcheck);
    cy.getAlert(commonlocators.optionchangetextSwitch);
    cy.closePropertyPane();
  });

  it("Form reset button valdiation with switch widget", function() {
    cy.SearchEntityandOpen("FormButton2");
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Reset Widget")
      .click();
    cy.get(widgetsPage.selectWidget).click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Toggler")
      .click();
    cy.closePropertyPane();
    cy.get(widgetsPage.switchWidget).click();
    cy.get(widgetsPage.toastMsg)
      .last()
      .invoke("text")
      .then((text) => {
        const toasttext = text;
        cy.log(toasttext);
        expect(text.trim()).to.equal(toasttext.trim());
      });
    cy.get(widgetsPage.switchWidgetInactive).should("be.visible");
    cy.get("Button:contains('Reset')").click({ force: true });
    cy.get(widgetsPage.switchWidgetActive).should("be.visible");
  });
});
