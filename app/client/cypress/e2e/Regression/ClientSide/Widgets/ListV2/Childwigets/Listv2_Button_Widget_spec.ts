import * as _ from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";

describe(
  "List v2- Tabs Widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("Listv2/simpleListWithInputAndButton");
    });

    it("1. should not throw error when on click event is changed No Action", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget, {}, [
        "List1",
        "Container1",
      ]);
      _.propPane.EnterJSContext("onClick", "{{showAlert('Hello')}}");
      _.agHelper.Sleep();
      _.agHelper.ClickButton("Submit");
      _.agHelper.ValidateToastMessage("Hello");

      // Wait for toastmsg to close
      _.agHelper.WaitUntilAllToastsDisappear();

      // Clear the event
      _.propPane.UpdatePropertyFieldValue("onClick", "");
      _.agHelper.Sleep();
      _.agHelper.ClickButton("Submit");

      _.agHelper.AssertElementAbsence(_.locators._specificToast("Hello"));
    });
  },
);
