const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");

describe(
  "RichTextEditor Widget Functionality in Form",
  { tags: ["@tag.Widget", "@tag.Form", "@tag.TextEditor", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formWithRTEDsl");
    });

    beforeEach(() => {
      cy.openPropertyPane("richtexteditorwidget");
    });

    it("RichTextEditor required functionality", function () {
      //Validate Html
      cy.validateHTMLText(
        formWidgetsPage.richTextEditorWidget,
        "h1",
        "Default",
      );

      //changing the Text Name
      cy.widgetText(
        this.dataSet.RichTextEditorName,
        formWidgetsPage.richTextEditorWidget,
        widgetsPage.widgetNameSpan,
      );

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
  },
);
