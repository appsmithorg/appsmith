const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

/**
 * A function to set the content inside an RTE widget
 * @param textValue
 */
const setRTEContent = (textValue) => {
  // Set the content inside RTE widget
  cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then(($iframe) => {
    const $body = $iframe.contents().find("body");
    cy.wrap($body).type(textValue, { force: true });
  });
};

/**
 * A function to test if the cursor position is at the end of the string.
 * @param textValueLen
 */
const testCursorPoistion = (textValueLen, tinyMceId) => {
  cy.window().then((win) => {
    const editor = win.tinymce.editors[tinyMceId];

    // Get the current cursor location
    const getCurrentCursorLocation = editor.selection.getSel().anchorOffset;

    // Check if the cursor is at the end.
    expect(getCurrentCursorLocation).to.be.equal(textValueLen);
  });
};

describe("RichTextEditor Widget Functionality", function () {
  before(() => {
    cy.fixture("formdsl1").then((val) => {
      _.agHelper.AddDsl(val);
    });
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

    cy.setTinyMceContent("rte-6h8j08u7ea", "<h1>content</h1>");

    cy.validateHTMLText(formWidgetsPage.richTextEditorWidget, "h1", "content");
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
    cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then(($iframe) => {
      const $body = $iframe.contents().find("body");
      cy.get($body).type("abc", { force: true });
    });
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

  it("7. Check if the binding is getting removed from the text and the RTE widget", function () {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{RichtextEditor.text}}`);
    // Change defaultText of the RTE
    cy.openPropertyPane("richtexteditorwidget");
    cy.testJsontext("defaultvalue", "Test Content");

    //Check if the text widget has the defaultText of RTE
    cy.get(".t--widget-textwidget").should("contain", "Test Content");

    //Clear the default text from RTE
    cy.openPropertyPane("richtexteditorwidget");
    cy.testJsontext("defaultvalue", "");

    //Check if text widget and RTE widget does not have any text in it.
    cy.get(".t--widget-richtexteditorwidget").should("contain", "");
    cy.get(".t--widget-textwidget").should("contain", "");
  });

  it("8. Check if text does not re-appear when cut, inside the RTE widget", function () {
    cy.window().then((win) => {
      const tinyMceId = "rte-6h8j08u7ea";

      const editor = win.tinymce.editors[tinyMceId];

      //Set the content
      editor.setContent("Test Content");

      //Check the content:
      expect(editor.getContent({ format: "text" })).to.be.equal("Test Content");

      //Set the content
      editor.setContent("");

      //Check the content:
      expect(editor.getContent({ format: "text" })).to.be.equal("");
    });
  });

  it("9. Check if the cursor position is at the end for the RTE widget", function () {
    const tinyMceId = "rte-6h8j08u7ea";
    const testString = "Test Content";
    const testStringLen = testString.length;

    // Check if the cursor is at the end when input Type is HTML
    setRTEContent(testString);
    testCursorPoistion(testStringLen, tinyMceId);
    setRTEContent("{selectAll}");
    setRTEContent("{backspace}");

    // Changing the input type to markdown and again testing the cursor position
    cy.openPropertyPane("richtexteditorwidget");
    cy.get("span:contains('Markdown')").eq(0).click({ force: true });
    setRTEContent(testString);
    testCursorPoistion(testStringLen, tinyMceId);
  });

  it("10. Check if different font size texts are supported inside the RTE widget", function () {
    const tinyMceId = "rte-6h8j08u7ea";
    const testString = "Test Content";

    // Set the content inside RTE widget by typing
    setRTEContent(`${testString} {enter} ${testString} 1`);

    cy.get(".tox-tbtn--bespoke").click({ force: true });
    cy.contains("Heading 1").click({ force: true });

    cy.window().then((win) => {
      const editor = win.tinymce.editors[tinyMceId];

      // Get the current editor text
      const getCurrentHtmlContent = editor.getContent();

      // Check if the editor contains text of font sizes h1 and p;
      expect(getCurrentHtmlContent).contains("<h1>");
      expect(getCurrentHtmlContent).contains("<p>");
    });
  });

  it("11. Check if button for Underline exists within the Toolbar of RTE widget", () => {
    cy.get('[aria-label="Underline"]').should("exist");

    //Check if button for Background Color is rendered only once within the Toolbar of RTE widget
    cy.get('[aria-label="Background color"]').should("have.length", 1);

    //Check if button for Text Color is rendered only once within the Toolbar of RTE widget
    cy.get('[aria-label="Text color"]').should("have.length", 1);
  });

  it("12. Check if able to add an emoji through toolbar", () => {
    cy.get('[aria-label="More..."]').click({ force: true });
    cy.wait(500);
    cy.get('[aria-label="Emoticons"]').click({ force: true });
    cy.wait(500);
    cy.get('[aria-label="grinning"]').click({ force: true });
    const getEditorContent = (win) => {
      const tinyMceId = "rte-6h8j08u7ea";
      const editor = win.tinymce.editors[tinyMceId];
      return editor.getContent();
    };

    //contains emoji
    cy.window().then((win) => {
      expect(getEditorContent(win)).contains("😀");
    });

    //trigger a backspace
    cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then(($iframe) => {
      const $body = $iframe.contents().find("body");
      cy.get($body).type("{backspace}", { force: true });
    });

    // after backspace the emoji should not be present
    cy.window().then((win) => {
      expect(getEditorContent(win)).not.contains("😀");
    });
  });
});
