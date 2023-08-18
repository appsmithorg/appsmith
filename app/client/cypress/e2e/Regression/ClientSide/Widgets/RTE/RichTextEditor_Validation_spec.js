const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("RichTextEditor Widget Validation", function () {
  before(() => {
    _.agHelper.AddDsl("formdsl1");
  });

  beforeEach(() => {
    cy.wait(7000);
    cy.openPropertyPane("richtexteditorwidget");
  });

  it("RichTextEditor-required with empty content show error border for textarea", function () {
    cy.setTinyMceContent("rte-6h8j08u7ea", "");
    cy.get(commonlocators.requiredCheckbox).click({ force: true });
    cy.wait(500);

    // check that input border is red
    cy.get(formWidgetsPage.richTextEditorWidget + " .tox.tox-tinymce").should(
      "have.css",
      "border",
      "1px solid rgb(217, 25, 33)",
    );

    cy.closePropertyPane();
  });
});
