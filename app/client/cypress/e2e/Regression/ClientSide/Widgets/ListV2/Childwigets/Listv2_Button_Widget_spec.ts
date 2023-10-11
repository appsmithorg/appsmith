import * as _ from "../../../../../../support/Objects/ObjectsCore";

describe("List v2- Tabs Widget", () => {
  before(() => {
    _.agHelper.AddDsl("Listv2/simpleListWithInputAndButton");
  });

  it("1. should not throw error when on click event is changed No Action", () => {
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Button1");
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
});
