import { WIDGET } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Delete No Action card without any error", () => {
  it("1. Bug 23345", () => {
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);

    _.propPane.AddAction("onClick");

    _.agHelper.AssertElementVisible(_.propPane._actionCardByTitle("No action"));

    _.agHelper.GetNClick(_.propPane._actionSelectorDelete);

    _.agHelper.AssertElementAbsence(_.propPane._actionCardByTitle("No action"));
  });
});
