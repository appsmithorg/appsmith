import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Field value evaluation", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
  });

  it("1. Evaluation works for fields", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.SelectPlatformFunction("onClick", "Show alert");
    _.agHelper.TypeText(
      _.propPane._actionSelectorFieldByLabel("Message"),
      "{{Button1.text}}",
    );
    _.agHelper.VerifyEvaluatedValue("Submit");
  });
});
