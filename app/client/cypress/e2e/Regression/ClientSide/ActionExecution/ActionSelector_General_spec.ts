import {
  agHelper,
  appSettings,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - action selector general functions",
  { tags: ["@tag.JS"] },
  () => {

    let modalTextValue: string;

    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it.only("1. Verify that actions can be configured ", () => {
      propPane.EnterJSContext(
        "onClick",
        `{{showAlert("Action Selector Test Message", '')}}`,
        true,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Action Selector Test Message", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Action Selector Test Message", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it.only("2. Verify that callbacks can be configured with a success event", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{showAlert("Action Success Message", '')}}`,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));

      // add a success callback
      agHelper.GetNClick(propPane._actionAddCallback("success"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Success Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it.only("3. Verify that callbacks can be configured with a failure event", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", `{{showModal()}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetHoverNClick(propPane._actionCallbacks);

      agHelper.GetNClick(propPane._actionAddCallback("failure"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Failure Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it.only("4. Verify that callbacks can be chained", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetHoverNClick(propPane._actionCallbacks);

      agHelper.GetNClick(propPane._actionAddCallback("failure"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Second Failure Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Second Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Second Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it.only("5. Verify that the Callbacks section reflects the number of active callbacks accurately", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetHoverNClick(propPane._actionCallbacks);
      agHelper
      .GetText(propPane._getActionCardSelector("modal"))
      .then(($count) => {
        modalTextValue = $count as string;
        expect(modalTextValue).to.contain("+2");
      });
    });


    it.only("6. Verify that callbacks can be deleted", () => {
      agHelper
      .GetText(propPane._getActionCardSelector("modal"))
      .then(($count) => {
        modalTextValue = $count as string;
        expect(modalTextValue).to.contain("+1");
      });
    });

    
    it("7. Verify that configured actions on existing apps are intact", () => {});

    it("8. Verify that configured actions stay intact on import of an app", () => {});

    it("9. Verify that configured actions stay intact on partial import of a page", () => {});

    it("10. Verify that configured actions stay intact on forking an app", () => {});

    it("11. Verify that configured actions stay intact on navigating between pages", () => {});
  },
);
