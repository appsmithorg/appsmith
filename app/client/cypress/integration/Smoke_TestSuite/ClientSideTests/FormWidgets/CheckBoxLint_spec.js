const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/snippetDsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Checkbox Widget Functionality", function() {
    cy.openPropertyPane("checkboxwidget");
    /**
     * @param{Text} Random Text
     * @param{CheckboxWidget}Mouseover
     * @param{CheckboxPre Css} Assertion
     */
    cy.get(".CodeMirror-code .cm-keyword")
      .last()
      .invoke("text")
      .then((text) => {
        const someText = text;
        cy.log(someText);
        expect(someText).to.includes("function");
      });
  });
});
