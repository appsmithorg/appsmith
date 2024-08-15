import { locators } from "../../../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "RichTextEditor Widget Functionality",
  { tags: ["@tag.Widget", "@tag.TextEditor"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formdsl1");
      cy.waitUntil(() =>
        cy.get(locators._richText_TitleBlock).should("be.visible"),
      );
    });

    beforeEach(() => {
      cy.wait(3000);
      cy.openPropertyPane("richtexteditorwidget");
    });

    it("1. RichTextEditor-Edit Text area with HTML body functionality", function () {
      //changing the Text Name
      cy.widgetText(
        this.dataSet.RichTextEditorName,
        formWidgetsPage.richTextEditorWidget,
        widgetsPage.widgetNameSpan,
      );

      //Edit the text area with Html
      cy.testJsontext("defaultvalue", this.dataSet.HtmlText);

      //Validate Html
      cy.validateHTMLText(
        formWidgetsPage.richTextEditorWidget,
        "h1",
        "This is a Heading",
      );
      _.deployMode.DeployApp();
      cy.validateHTMLText(
        publishPage.richTextEditorWidget,
        "h1",
        "This is a Heading",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("2. RichTextEditor-Enable Validation", function () {
      //Uncheck the Disabled checkbox
      cy.UncheckWidgetProperties(formWidgetsPage.disableJs);
      cy.validateEnableWidget(
        formWidgetsPage.richTextEditorWidget,
        commonlocators.disabledBtn,
      );

      _.deployMode.DeployApp();
      cy.validateEnableWidget(
        publishPage.richTextEditorWidget,
        commonlocators.disabledBtn,
      );
      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("richtexteditorwidget");

      //Check the Disabled checkbox
      cy.CheckWidgetProperties(formWidgetsPage.disableJs);
      cy.validateDisableWidget(
        formWidgetsPage.richTextEditorWidget,
        commonlocators.disabledBtn,
      );

      _.deployMode.DeployApp();
      cy.validateDisableWidget(
        publishPage.richTextEditorWidget,
        commonlocators.disabledBtn,
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("3. RichTextEditor-check Visible field  validation", function () {
      // Uncheck the visible checkbox
      cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.richTextEditorWidget).should("not.exist");

      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("richtexteditorwidget");

      // RichTextEditor-uncheck Visible field validation
      cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.richTextEditorWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. RichTextEditor-check Hide toolbar field validation", function () {
      // Check the Hide toolbar checkbox
      cy.CheckWidgetProperties(commonlocators.hideToolbarCheckbox);
      cy.validateToolbarHidden(
        formWidgetsPage.richTextEditorWidget,
        commonlocators.rteToolbar,
      );
      _.deployMode.DeployApp();
      cy.validateToolbarHidden(
        publishPage.richTextEditorWidget,
        commonlocators.rteToolbar,
      );

      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("richtexteditorwidget");

      //RichTextEditor-uncheck Hide toolbar field validation - // Uncheck the Hide toolbar checkbox
      cy.UncheckWidgetProperties(commonlocators.hideToolbarCheckbox);
      cy.validateToolbarVisible(
        formWidgetsPage.richTextEditorWidget,
        commonlocators.rteToolbar,
      );
      _.deployMode.DeployApp();
      cy.validateToolbarVisible(
        publishPage.richTextEditorWidget,
        commonlocators.rteToolbar,
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Reset RichTextEditor", function () {
      // Enable the widget

      cy.UncheckWidgetProperties(formWidgetsPage.disableJs);

      cy.setTinyMceContent("rte-component-vw4zehojqt", "<h1>content</h1>");

      cy.validateHTMLText(
        formWidgetsPage.richTextEditorWidget,
        "h1",
        "content",
      );
      cy.openPropertyPane("buttonwidget");
      cy.get(".t--property-control-onclick")
        .find(".t--js-toggle")
        .click({ force: true });
      cy.testJsontext("onclick", '{{resetWidget("RichtextEditor", true)}}');
      cy.get(".t--widget-buttonwidget .bp3-button").click({ force: true });
      cy.wait(500);
      cy.validateHTMLText(
        formWidgetsPage.richTextEditorWidget,
        "h1",
        "This is a Heading",
      );
    });

    it("6. Check isDirty meta property", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{RichtextEditor.isDirty}}`,
      );
      cy.openPropertyPane("richtexteditorwidget");
      // Change defaultText
      cy.testJsontext("defaultvalue", "a");
      // Check if isDirty has been changed into false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then(
        ($iframe) => {
          const $body = $iframe.contents().find("body");
          cy.get($body).type("abc", { force: true });
        },
      );
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Change defaultText
      cy.openPropertyPane("richtexteditorwidget");
      cy.testJsontext("defaultvalue", "b");
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");

      /**
       * Check the following scenario
       * After reset, post entering default text, isDirty should remain false;
       */
      cy.get(".t--widget-buttonwidget .bp3-button").click({ force: true });
      cy.wait(500);
      cy.openPropertyPane("richtexteditorwidget");
      cy.testJsontext("defaultvalue", "c");
      cy.get(".t--widget-textwidget").should("contain", "false");
    });
  },
);
