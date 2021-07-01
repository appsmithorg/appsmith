const dsl = require("../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("Button-Style Validation", function() {
    //Changing the style of the button from the property pane and verify it's color.
    // Change to Secondary button sytle
    cy.changeButtonStyle(2, "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)");
    cy.get(publishPage.backToEitor).click({ force: true });
    // Change to Danger button sytl
    cy.openPropertyPane("buttonwidget");
    cy.changeButtonStyle(3, "rgb(179, 3, 56)", "rgb(139, 2, 43)");
  });

  afterEach(() => {
    // cy.get(publishPage.backToEditor).click({ force: true });
  });
});
