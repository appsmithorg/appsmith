const commonlocators = require("../../../locators/commonlocators.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Container Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Container Widget Functionality", function() {
    cy.openPropertyPane("containerwidget");
    /**
     * @param{Text} Random Text
     * @param{ContainerWidget}Mouseover
     * @param{ContainerPre Css} Assertion
     */
    cy.widgetText(
      "job",
      widgetsPage.containerWidget,
      commonlocators.containerInnerText,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.testCodeMirror(this.data.colour);
    cy.get(widgetsPage.containerD)
      .should("have.css", "background-color")
      .and("eq", "rgb(255, 0, 0)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.Scrollbutton);
    cy.get(widgetsPage.containerD)
      .eq(0)
      .scrollIntoView({ easing: "linear" })
      .should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
