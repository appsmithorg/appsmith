import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Autocomplete bug fixes", function () {
  it("1. Bug #23641 Verifies if 'children' shows up in autocomplete list", function () {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.MULTITREESELECT,
      200,
      200,
    );
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.TREESELECT,
      200,
      400,
    );
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 200, 600);
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", "{{TreeSelect1.options[0].c");
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "children",
      "contain.text",
    );

    _.propPane.TypeTextIntoField("Text", "{{MultiTreeSelect1.options[0].c");
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "children",
      "contain.text",
    );
  });
});
