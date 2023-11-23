import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Field value evaluation", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
  });

  it("1. Evaluation works for fields", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.SelectPlatformFunction("onClick", "Show alert");
    agHelper.EnterActionValue("Message", "{{Button1.text}}");
    agHelper.VerifyEvaluatedValue("Submit");
  });
});
