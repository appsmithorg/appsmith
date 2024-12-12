import { locators } from "../../../../../support/Objects/ObjectsCore";

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
    const editor = win.tinymce.EditorManager.get(tinyMceId);

    // Get the current cursor location
    const getCurrentCursorLocation = editor.selection.getSel().anchorOffset;

    // Check if the cursor is at the end.
    expect(getCurrentCursorLocation).to.be.equal(textValueLen);
  });
};

describe(
  "RichTextEditor Widget Functionality",
  { tags: ["@tag.Widget", "@tag.TextEditor", "@tag.Binding"] },
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

    it("1. Check if the binding is getting removed from the text and the RTE widget", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{RichTextEditor1.text}}`,
      );
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

    it("2. Check if text does not re-appear when cut, inside the RTE widget", function () {
      cy.window().then((win) => {
        const tinyMceId = "rte-component-vw4zehojqt";

        const editor = win.tinymce.EditorManager.get(tinyMceId);

        //Set the content
        editor.setContent("Test Content");

        //Check the content:
        expect(editor.getContent({ format: "text" })).to.be.equal(
          "Test Content",
        );

        //Set the content
        editor.setContent("");

        //Check the content:
        expect(editor.getContent({ format: "text" })).to.be.equal("");
      });
    });

    it("3. Check if the cursor position is at the end for the RTE widget", function () {
      const tinyMceId = "rte-component-vw4zehojqt";
      const testString = "Test Content";
      const testStringLen = testString.length;

      // Check if the cursor is at the end when input Type is HTML
      setRTEContent(testString);
      testCursorPoistion(testStringLen, tinyMceId);
      setRTEContent("{selectAll}{del}");

      // Changing the input type to markdown and again testing the cursor position
      cy.openPropertyPane("richtexteditorwidget");
      cy.get("span:contains('Markdown')").eq(0).click({ force: true });
      setRTEContent(testString);
      testCursorPoistion(testStringLen, tinyMceId);
    });

    it("4. Check if different font size texts are supported inside the RTE widget", function () {
      const tinyMceId = "rte-component-vw4zehojqt";
      const testString = "Test Content";

      // Set the content inside RTE widget by typing
      setRTEContent(`${testString} {enter} ${testString} 1`);

      cy.get(".tox-tbtn--bespoke").click({ force: true });
      cy.contains("Heading 1").click({ force: true });

      cy.window().then((win) => {
        const editor = win.tinymce.EditorManager.get(tinyMceId);

        // Get the current editor text
        const getCurrentHtmlContent = editor.getContent();

        // Check if the editor contains text of font sizes h1 and p;
        expect(getCurrentHtmlContent).contains("<h1>");
        expect(getCurrentHtmlContent).contains("<p>");
      });
    });

    it("5. Check if button for Underline exists within the Toolbar of RTE widget", () => {
      cy.get('[aria-label="Underline"]').should("exist");

      //Check if button for Background Color is rendered only once within the Toolbar of RTE widget
      cy.get('[aria-label="Background color Black"]').should("have.length", 1);

      //Check if button for Text Color is rendered only once within the Toolbar of RTE widget
      cy.get('[aria-label="Text color Black"]').should("have.length", 1);
    });

    it("6. Check if able to add an emoji through toolbar", () => {
      cy.get('[aria-label="Reveal or hide additional toolbar items"]').click({
        force: true,
      });
      cy.get('[aria-label="Emojis"]').click({ force: true });
      cy.get('[aria-label="grinning"]').click({ force: true });
      const getEditorContent = (win) => {
        const tinyMceId = "rte-component-vw4zehojqt";
        const editor = win.tinymce.EditorManager.get(tinyMceId);
        return editor.getContent();
      };

      //contains emoji
      cy.window().then((win) => {
        expect(getEditorContent(win)).contains("😀");
      });

      //trigger a backspace
      cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then(
        ($iframe) => {
          const $body = $iframe.contents().find("body");
          cy.get($body).type("{backspace}", { force: true });
        },
      );

      // after backspace the emoji should not be present
      cy.window().then((win) => {
        expect(getEditorContent(win)).not.contains("😀");
      });
    });
  },
);
