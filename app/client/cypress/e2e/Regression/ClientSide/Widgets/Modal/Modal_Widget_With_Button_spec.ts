import commonlocators from "../../../../../locators/commonlocators.json";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Modal Widget Functionality with auto layout", function () {
  it("1. Add new Modal widget with other widgets and validate with Auto layout", () => {
    _.agHelper.GetNClick(commonlocators.autoConvert);
    _.agHelper.GetNClick(commonlocators.convert);
    _.agHelper.GetNClick(commonlocators.refreshApp);
    _.entityExplorer.DragDropWidgetNVerify("modalwidget", 300, 300);
    _.agHelper.AssertElementExist(_.locators._modal);
    _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 100, 200);
    _.entityExplorer.DragDropWidgetNVerify("inputwidgetv2", 10, 20);
    _.entityExplorer.DragDropWidgetNVerify("buttonwidget", 20, 30);
    _.agHelper.AssertElementAbsence(_.locators._modal);
    _.propPane.createModal("Modal1", "onClick");
    _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
    _.agHelper.AssertElementExist(_.locators._widgetInCanvas("inputwidgetv2"));
    _.agHelper.AssertElementExist(
      _.locators._widgetInCanvas("inputwidgetv2"),
      1,
    );
    _.agHelper.AssertElementExist(_.locators._widgetInCanvas("buttonwidget"));
    _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
  });
});
