import * as _ from "../../../../../support/Objects/ObjectsCore";
import {
  WIDGET,
  getWidgetSelector,
} from "../../../../../locators/WidgetLocators";

describe("Table widget v2", function () {
  it("1. should test that pageSize is computed properly for all the row sizes", function () {
    _.entityExplorer.AddNewPage();
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 300, 100);
    _.propPane.UpdatePropertyFieldValue("Text", "{{Table1.pageSize}}");
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.TABLE, 500, 300);
    _.propPane.MoveToTab("STYLE");
    _.agHelper.GetNClick(_.propPane._rowHeightBtn("SHORT"));

    _.agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($text) => {
      expect($text).to.eq("7");
    });

    _.agHelper.GetNClick(_.propPane._rowHeightBtn("DEFAULT"));
    _.agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($text) => {
      expect($text).to.eq("5");
    });

    _.agHelper.GetNClick(_.propPane._rowHeightBtn("TALL"));
    _.agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($text) => {
      expect($text).to.eq("4");
    });
  });
});
