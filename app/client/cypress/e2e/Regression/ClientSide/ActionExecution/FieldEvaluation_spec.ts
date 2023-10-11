import {
  agHelper,
  entityExplorer,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Field value evaluation", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
  });

  it("1. Evaluation works for fields", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.EnterActionValue("Message", "{{Button1.text}}");
    agHelper.VerifyEvaluatedValue("Submit");
  });
});
