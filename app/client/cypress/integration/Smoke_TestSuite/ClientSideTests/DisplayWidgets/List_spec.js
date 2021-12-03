const dsl = require("../../../../fixtures/newFormDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("Button-Color Validation", function() {
    // Changing the color of the button from the property pane and verifying it.
    cy.changeButtonColor("rgb(254, 184, 17)");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
