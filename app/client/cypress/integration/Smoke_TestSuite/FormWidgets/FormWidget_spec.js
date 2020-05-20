const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Form Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Form Widget Functionality", function() {
    cy.openPropertyPane("formwidget");
    /**
     * @param{Text} Random Text
     * @param{FormWidget}Mouseover
     * @param{FormPre Css} Assertion
     */
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.testCodeMirror(this.data.colour);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(255, 0, 0)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(commonlocators.scrollView);
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom")
      .should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
