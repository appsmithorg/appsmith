import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Top five widgets", function() {
  it("Drag and drop widgets", function() {
    _.canvasHelper.DragNDropFromTopbar("BUTTON_WIDGET", { x: 300, y: 100 });
    _.canvasHelper.DragNDropFromTopbar("TEXT_WIDGET", { x: 500, y: 100 });
    _.canvasHelper.DragNDropFromTopbar("CONTAINER_WIDGET", { x: 300, y: 200 });
    _.canvasHelper.DragNDropFromTopbar("INPUT_WIDGET_V2", { x: 500, y: 200 });
    _.canvasHelper.DragNDropFromTopbar("TABLE_WIDGET_V2", { x: 700, y: 300 });

    _.agHelper.RefreshPage();

    _.agHelper.AssertElementExist(".t--widget-textwidget");
    _.agHelper.AssertElementExist(".t--widget-containerwidget");
    _.agHelper.AssertElementExist(".t--widget-buttonwidget");
    _.agHelper.AssertElementExist(".t--widget-inputwidgetv2");
    _.agHelper.AssertElementExist(".t--widget-tablewidgetv2");
  });
});
