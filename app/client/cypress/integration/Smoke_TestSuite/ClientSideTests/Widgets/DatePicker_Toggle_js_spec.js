const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

describe("DatePicker Widget Property pane tests with js bindings", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("datepickerwidget");
  });

  it("Datepicker default date validation with js binding", function() {
    cy.get(".t--property-control-defaultdate .bp3-input").clear();
    cy.get(formWidgetsPage.toggleJsDefaultDate).click();
    cy.testJsontext(
      "defaultdate",
      "{{moment('14/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
    );
    cy.get(formWidgetsPage.toggleJsMinDate).click();
    cy.testJsontext(
      "mindate",
      "{{moment('12/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
    );
    cy.get(formWidgetsPage.toggleJsMaxDate).click();
    cy.testJsontext(
      "maxdate",
      "{{moment('17/02/2021', 'DD/MM/YYYY').format('DD/MM/YYYY')}}",
    );
    cy.get(formWidgetsPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      "14/02/2021",
    );
    cy.PublishtheApp();
    cy.get(publishPage.datepickerWidget + " .bp3-input").should(
      "contain.value",
      "14/02/2021",
    );
  });

  afterEach(() => {
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
