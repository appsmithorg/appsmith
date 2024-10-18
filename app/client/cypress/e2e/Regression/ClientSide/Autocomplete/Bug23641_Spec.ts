import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Autocomplete bug fixes",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    it("1. Bug #23641 Verifies if 'children' shows up in autocomplete list", function () {
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.MULTITREESELECT,
        200,
        200,
      );
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.TREESELECT,
        200,
        400,
      );
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", "{{TreeSelect1.options[0].c");
      agHelper.AssertElementExist(locators._hints);
      agHelper.GetNAssertElementText(
        locators._hints,
        "children",
        "contain.text",
      );

      propPane.TypeTextIntoField("Text", "{{MultiTreeSelect1.options[0].c");
      agHelper.AssertElementExist(locators._hints);
      agHelper.GetNAssertElementText(
        locators._hints,
        "children",
        "contain.text",
      );
    });
  },
);
