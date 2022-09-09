const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/datepicker_switchDsl.json");
const dayjs = require("dayjs");

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

  it("Date Widget with Reset widget being switch widget", function() {
    cy.SearchEntityandOpen("DatePicker1");
    cy.get(formWidgetsPage.defaultDate).click();
    cy.SetDateToToday();
    cy.setDate(1, "ddd MMM DD YYYY");
    const nextDay = dayjs().format("DD/MM/YYYY");
    cy.log(nextDay);
    cy.get(widgetsPage.actionSelect).click({ force: true });
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Reset widget")
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
  });

  it("DatePicker-Date change and validate switch widget status", function() {
    cy.get(widgetsPage.datepickerInput).click({ force: true });
    cy.SetDateToToday();
    cy.get(widgetsPage.switchWidgetActive).should("be.visible");
    cy.get(".t--toast-action span")
      .last()
      .invoke("text")
      .then((text) => {
        const toasttext = text;
        cy.log(toasttext);
        expect(text.trim()).to.equal(toasttext.trim());
      });
  });
});

afterEach(() => {
  // put your clean up code if any
});
