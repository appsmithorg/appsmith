import type { TinyMCE } from "tinymce";
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

declare global {
  interface Window {
    tinymce: TinyMCE;
  }
}

function getActiveEditor(win: Window) {
  const editor = win.tinymce.activeEditor;

  if (!editor) {
    throw new Error("TinyMCE active editor is missing");
  }

  return editor;
}

function firstFamily(font: string) {
  return font.split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
}

function fontFamilyAtCaret(editor: ReturnType<typeof getActiveEditor>) {
  return firstFamily(
    editor.dom.getStyle(editor.selection.getNode(), "font-family", true) || "",
  );
}

describe(
  "Rich Text Editor widget Tests",
  { tags: ["@tag.Widget", "@tag.TextEditor", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("richTextEditorDsl");
      EditorNavigation.SelectEntityByName("RichTextEditor1", EntityType.Widget);
      cy.waitUntil(() =>
        cy.get(locators._richText_TitleBlock).should("be.visible"),
      );
    });

    it("1. Verify deleting text in default text property, updates data in widget", function () {
      propPane.UpdatePropertyFieldValue("Default value", "");
      agHelper
        .GetElement(
          locators._widgetInDeployed("richtexteditorwidget") + " iframe",
        )
        .then(($iframe) => {
          const $body = $iframe.contents().find("body");
          expect($body).to.contain("");
        });
    });

    it("2. Verify changing style to Heading and pressing enter should change style to paragraph", function () {
      agHelper.GetNClick(locators._richText_TitleBlock);
      agHelper.GetNClick(locators._richText_Heading);
      agHelper.AssertText(locators._richText_Label_Text, "text", "Heading 1");
      agHelper
        .GetElement(
          locators._widgetInDeployed("richtexteditorwidget") + " iframe",
        )
        .then(($iframe) => {
          const $body = $iframe.contents().find("body");
          agHelper.TypeText($body, "Test Heading");
          agHelper.GetElement($body).type("{enter}");
        });
      agHelper.AssertText(locators._richText_Label_Text, "text", "Paragraph");
    });

    it("3. Verify applying style in one line should be observed in next line", function () {
      agHelper.GetNClick(locators._richText_ToolbarOverflow);
      agHelper.GetNClick(locators._richText_Text_Color("Black"));
      agHelper.GetNClick(locators._richText_color("Red"));
      agHelper
        .GetElement(
          locators._widgetInDeployed("richtexteditorwidget") + " iframe",
        )
        .then(($iframe) => {
          const iframe = $iframe.contents();
          const $body = $iframe.contents().find("body");
          agHelper.TypeText($body, "Test Red");
          agHelper.GetElement($body).type("{enter}");
          agHelper.TypeText($body, "Test Red 2");
        });
      agHelper
        .GetElement(
          locators._widgetInDeployed("richtexteditorwidget") + " iframe",
        )
        .then(($iframe) => {
          const iframe = $iframe.contents();

          const $span = iframe.find(locators._richText_line);
          agHelper.AssertAttribute(
            $span,
            "style",
            "color: rgb(224, 62, 45);",
            0,
          );
          agHelper.AssertAttribute(
            $span,
            "style",
            "color: rgb(224, 62, 45);",
            1,
          );
        });
    });

    it("4. Verify applying a font family from the toolbar writes font-family into the editor HTML", function () {
      let htmlBefore = "";

      cy.window().then((win) => {
        htmlBefore = getActiveEditor(win).getContent().toLowerCase();
        expect(htmlBefore).to.not.contain("font-family");
      });
      agHelper.GetNClick(locators._richText_FontFamily);
      agHelper.GetNClick(locators._richText_FontFamilyOption("Arial"));
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.insertContent("ArialText");

        const htmlAfter = editor.getContent().toLowerCase();

        expect(htmlAfter).to.not.equal(htmlBefore);
        expect(htmlAfter).to.contain("font-family");
        expect(htmlAfter).to.contain("arial");
      });
    });

    it("5. Verify choosing a font with a collapsed caret applies to the next typed text", function () {
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.focus();
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);
        expect(editor.getContent().toLowerCase()).to.not.contain("georgia");
      });
      agHelper.GetNClick(locators._richText_FontFamily);
      agHelper.GetNClick(locators._richText_FontFamilyOption("Georgia"));
      cy.get(locators._richText_FontFamily).should(
        "have.attr",
        "aria-label",
        "Font Georgia",
      );
      cy.window().then((win) => {
        expect(getActiveEditor(win).getContent().toLowerCase()).to.not.contain(
          "georgia",
        );
      });
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.insertContent("GeorgiaText");
        expect(editor.getContent().toLowerCase()).to.contain("georgia");
      });
    });

    it("6. Verify moving the caret after picking a font does not apply it at the new location", function () {
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.focus();
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(false);
        expect(editor.getContent().toLowerCase()).to.not.contain("courier");
      });
      agHelper.GetNClick(locators._richText_FontFamily);
      agHelper.GetNClick(locators._richText_FontFamilyOption("Courier New"));
      cy.get(locators._richText_FontFamily).should(
        "have.attr",
        "aria-label",
        "Font Courier New",
      );
      cy.window().then((win) => {
        const editor = getActiveEditor(win);
        const body = editor.getBody();

        expect(editor.getContent().toLowerCase()).to.not.contain("courier");
        // Stay collapsed: select-all would clear pending for a different reason.
        editor.selection.setCursorLocation(body.firstChild || body, 0);
      });
      cy.get(locators._richText_FontFamily).should(
        "not.have.attr",
        "aria-label",
        "Font Courier New",
      );
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.insertContent("NoCourier");

        expect(editor.getContent().toLowerCase()).to.contain("nocourier");
        expect(fontFamilyAtCaret(editor)).to.not.match(/courier/);
      });
    });

    it("7. Verify picking Arial inside Arial Black text applies Arial to the next insert", function () {
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.focus();
        editor.selection.select(editor.getBody(), true);
      });
      agHelper.GetNClick(locators._richText_FontFamily);
      agHelper.GetNClick(locators._richText_FontFamilyOption("Arial Black"));
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        expect(editor.getContent().toLowerCase()).to.contain("arial black");
        editor.selection.select(editor.getBody(), true);
        editor.selection.collapse(true);
      });
      agHelper.GetNClick(locators._richText_FontFamily);
      agHelper.GetNClick(locators._richText_FontFamilyOption("Arial"));
      cy.get(locators._richText_FontFamily).should(
        "have.attr",
        "aria-label",
        "Font Arial",
      );
      cy.window().then((win) => {
        const editor = getActiveEditor(win);

        editor.insertContent("ArialNotBlack");

        expect(editor.getContent().toLowerCase()).to.contain("arialnotblack");
        expect(fontFamilyAtCaret(editor)).to.eq("arial");
      });
    });
  },
);
