import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Rich Text Editor widget Tests",
  { tags: ["@tag.Widget", "@tag.TextEditor"] },
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
      agHelper.GetNClick(locators._richText_Text_Color);
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
  },
);
