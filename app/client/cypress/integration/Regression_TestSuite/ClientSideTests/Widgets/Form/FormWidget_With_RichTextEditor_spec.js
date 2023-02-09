const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const dsl = require("../../../../../fixtures/formWithRTEDsl.json");

describe("RichTextEditor Widget Functionality in Form", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.wait(7000);
    cy.openPropertyPane("richtexteditorwidget");
  });

  it("RichTextEditor required functionality", function() {
    //changing the Text Name
    cy.widgetText(
      this.data.RichTextEditorName,
      formWidgetsPage.richTextEditorWidget,
      formWidgetsPage.richTextEditorWidget + " " + commonlocators.widgetNameTag,
    );

    //Validate Html
    cy.validateHTMLText(formWidgetsPage.richTextEditorWidget, "h1", "Default");
    //   Make RTE Required
    cy.CheckWidgetProperties(formWidgetsPage.requiredJs);

    //   Clear the input
    cy.testJsontext("defaultvalue", "");

    cy.wait(500);
    cy.get(formWidgetsPage.richTextEditorWidget + " .tox.tox-tinymce").should(
      "have.css",
      "border",
      "1px solid rgb(217, 25, 33)",
    );

    cy.get(".t--draggable-formbuttonwidget button").should("be.disabled");
  });
  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
