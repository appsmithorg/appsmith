const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const dsl = require("../../../../fixtures/tabledsl.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");
const widgetsPage = require("../../../../locators/Widgets.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it.only("Verify autocomplete on typing slash for Table widget", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.testCodeMirror("/").then(() => {
      cy.autocompleteSuggestions();
    });
    cy.get(".t--property-control-defaultsearchtext")
      .children()
      .last()
      .type("/")
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-defaultselectedrow")
      .children()
      .last()
      .type("/")
      .then(() => {
        cy.autocompleteSuggestions();
      });

    cy.get(".t--property-control-onrowselected")
      .find(".t--js-toggle")
      .click();
    cy.EnableAllCodeEditors();
    cy.get(".t--property-control-" + "onrowselected" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-onpagechange")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "onpagechange" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-onpagesizechange")
      .find(".t--js-toggle")
      .click();
    cy.get(
      ".t--property-control-" + "onpagesizechange" + " .CodeMirror textarea",
    )
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-onsearchtextchanged")
      .find(".t--js-toggle")
      .click();
    cy.get(
      ".t--property-control-" + "onsearchtextchanged" + " .CodeMirror textarea",
    )
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-onsort")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "onsort" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--widget-propertypane-toggle").type("{del}");
  });
  it("Verify autocomplete suggestions on slash for button widget", () => {
    cy.dragAndDropToCanvas("buttonwidget", { x: 200, y: 100 });
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "visible" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-googlerecaptchakey")
      .children()
      .last()
      .type("/")
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-disabled")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "disabled" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--property-control-" + "animateloading" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--property-control-" + "onclick" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--widget-propertypane-toggle").type("{del}");
  });
  it.only("Verify autocomplete suggestions on slash for checkbox widget", () => {
    cy.dragAndDropToCanvas("checkboxwidget", { x: 200, y: 100 });
    cy.testCodeMirror("/").then(() => {
      cy.autocompleteSuggestions();
    });
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "visible" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get("body").click(0, 0);
    cy.get(".t--property-control-disabled")
      .find(".t--js-toggle")
      .click();
    cy.get(".t--property-control-" + "disabled" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--property-control-" + "onclick" + " .CodeMirror textarea")
      .first()
      .focus({ force: true })
      .type("/", { force: true })
      .then(() => {
        cy.autocompleteSuggestions();
      });
    cy.get(".t--widget-propertypane-toggle").type("{del}");
  });
});
