const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("RichTextEditor Widget Functionality in Form", function () {
  before(() => {
    _.agHelper.AddDsl("formWithRTEDsl");
  });

  beforeEach(() => {
    cy.openPropertyPane("richtexteditorwidget");
  });

  it("RichTextEditor required functionality", function () {
    //changing the Text Name
    cy.widgetText(
      this.dataSet.RichTextEditorName,
      formWidgetsPage.richTextEditorWidget,
      widgetsPage.widgetNameSpan,
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
});
