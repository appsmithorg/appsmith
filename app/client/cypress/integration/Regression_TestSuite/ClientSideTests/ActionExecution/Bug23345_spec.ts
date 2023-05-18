import { WIDGET } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, entityExplorer, propPane } = _;

describe("Delete No Action card without any error", () => {
  it("Bug 23345", () => {
    entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);

    propPane.AddAction("onClick");

    agHelper.AssertElementVisible(propPane._actionCardByTitle("No action"));

    agHelper.GetNClick(propPane._actionSelectorDelete);

    agHelper.AssertElementAbsence(propPane._actionCardByTitle("No action"));
  });
});
