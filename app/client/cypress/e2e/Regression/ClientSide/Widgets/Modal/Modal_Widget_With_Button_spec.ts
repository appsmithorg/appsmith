import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Modal Widget with auto-layout usecases",
  { tags: ["@tag.All", "@tag.Modal", "@tag.Binding"] },
  function () {
    it("1. Add new Modal widget with other widgets and validate with auto-layout", () => {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MODAL,
        300,
        300,
      );
      _.agHelper.AssertElementExist(_.locators._modal);
      _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        100,
        200,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        10,
        20,
      );
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 20, 30);
      _.agHelper.AssertElementAbsence(_.locators._modal);
      _.propPane.CreateModal("onClick");
      _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
      _.agHelper.AssertElementExist(
        _.locators._widgetInCanvas("inputwidgetv2"),
      );
      _.agHelper.AssertElementExist(
        _.locators._widgetInCanvas("inputwidgetv2"),
        1,
      );
      _.agHelper.AssertElementExist(_.locators._widgetInCanvas("buttonwidget"));
      _.agHelper.GetNClick(_.locators._closeModal, 0, true, 0);
    });
  },
);
