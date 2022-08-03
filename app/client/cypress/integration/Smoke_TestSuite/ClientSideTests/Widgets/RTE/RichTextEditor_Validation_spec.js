const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/formdsl1.json");

describe("RichTextEditor Widget Validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.wait(7000);
    cy.openPropertyPane("richtexteditorwidget");
  });

  it("RichTextEditor-required with empty content show error border for textarea", function() {
    cy.setTinyMceContent("rte-6h8j08u7ea", "");
    cy.get(commonlocators.requiredCheckbox).click({ force: true });
    cy.wait(500);

    // check that input border is red
    cy.get(
      formWidgetsPage.richTextEditorWidget +
        " div[data-testid='rte-container'] > div",
    ).should("have.css", "border", "1px solid rgb(242, 43, 43)");

    cy.closePropertyPane();
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
