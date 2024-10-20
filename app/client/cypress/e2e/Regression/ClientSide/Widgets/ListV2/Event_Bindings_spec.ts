import {
  agHelper,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Listv2 - Event bindings spec",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    it("1. nested list - inner widget should have access to currentItem, currentIndex, currentView and level_1", () => {
      agHelper.AddDsl("Listv2/nestedList");
      // Open the property pane of button in the inner list widget
      EditorNavigation.SelectEntityByName("Button3", EntityType.Widget, {}, [
        "List1",
        "Container1",
        "List2",
        "Container2",
      ]);
      // Enable JS mode for onClick
      propPane.ToggleJSMode("onClick", true);
      propPane.UpdatePropertyFieldValue(
        "onClick",
        "{{showAlert(`${level_1.currentView.Text1.text} _ ${level_1.currentItem.id} _ ${level_1.currentIndex} _ ${level_1.currentView.Input1.text} _ ${currentView.Input2.text}`)}}",
      );

      //Enter text in the parent list widget's text input
      agHelper.TypeText(
        locators._widgetInputSelector("inputwidgetv2"),
        "inner input",
        {
          shouldFocus: false,
        },
      );
      // Enter text in the child list widget's text input in first row
      agHelper.TypeText(
        locators._widgetInputSelector("inputwidgetv2"),
        "outer input",
        {
          index: 3,
          shouldFocus: false,
        },
      );

      // click the button on inner list 1st row.
      agHelper.ClickButton("Submit");
      agHelper.WaitUntilToastDisappear(
        "Blue _ 001 _ 0 _ outer input _ inner input",
      );
    });

    it("2. nested list - inner widget should get updated values of currentView and level_1", () => {
      // Enter text in the parent list widget's text input
      agHelper.TypeText(
        locators._widgetInputSelector("inputwidgetv2"),
        " updated",
        {
          index: 3,
          shouldFocus: false,
        },
      );

      // Enter text in the child list widget's text input in first row
      agHelper.TypeText(
        locators._widgetInputSelector("inputwidgetv2"),
        " updated",
        {
          shouldFocus: false,
        },
      );

      // click the button on inner list 1st row.
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(
        "Blue _ 001 _ 0 _ outer input updated _ inner input updated",
      );
    });
  },
);
