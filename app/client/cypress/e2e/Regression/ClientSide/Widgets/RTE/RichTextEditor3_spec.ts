import {
  agHelper,
  locators,
  deployMode,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Rich Text Editor widget Tests", function () {
  before(() => {
    agHelper.AddDsl("richTextEditorDsl");
    entityExplorer.SelectEntityByName("RichTextEditor1", "Widgets");
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
    agHelper.GetNClick('[title="Blocks"]');
    agHelper.GetNClick('[title="Heading 1"]');
    agHelper.AssertText(".tox-tbtn__select-label", "text", "Heading 1");
    agHelper
      .GetElement(
        locators._widgetInDeployed("richtexteditorwidget") + " iframe",
      )
      .then(($iframe) => {
        const $body = $iframe.contents().find("body");
        agHelper.TypeText($body, "Test Heading");
        agHelper.GetElement($body).type("{enter}");
      });
    agHelper.AssertText(".tox-tbtn__select-label", "text", "Paragraph");
  });

  it("3. Verify applying style in one line should be observed in next line", function () {
    agHelper.GetNClick('[title="Text color"] .tox-split-button__chevron');
    agHelper.GetNClick('[title="Red"]');
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

        const $span = iframe.find("#tinymce p span");
        agHelper.AssertAttribute($span, "style", "color: rgb(224, 62, 45);", 0);
        agHelper.AssertAttribute($span, "style", "color: rgb(224, 62, 45);", 1);
      });
  });
});
