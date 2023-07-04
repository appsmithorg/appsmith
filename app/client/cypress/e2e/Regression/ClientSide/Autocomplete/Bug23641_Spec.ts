import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Autocomplete bug fixes", function () {
  it("1. Bug #23641 Verifies if 'children' shows up in autocomplete list", function () {
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.MULTITREESELECT,
      200,
      200,
    );
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TREESELECT, 200, 400);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{TreeSelect1.options[0].c");
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "children", "contain.text");

    propPane.TypeTextIntoField("Text", "{{MultiTreeSelect1.options[0].c");
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "children", "contain.text");
  });
});
