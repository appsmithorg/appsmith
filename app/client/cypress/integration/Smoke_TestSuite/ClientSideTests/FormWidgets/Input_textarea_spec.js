const dsl = require("../../../../fixtures/InputTextAreaDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Input Widget with Texarea Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input Widget with Textarea Functionality", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.inputWidget + " " + "textarea").should(
      "have.css",
      "resize",
      "none",
    );
    /**
     * @param{Text} Random Text
     * @param{InputWidget}Mouseover
     * @param{InputPre Css} Assertion
     */
    cy.PublishtheApp();
  });
  it("Input Widget Functionality To Validate Textarea Cannot be Resized", function() {
    cy.get(publish.inputWidget + " " + "textarea").should(
      "have.css",
      "resize",
      "none",
    );
  });
});
afterEach(() => {
  // put your clean up code if any
});
