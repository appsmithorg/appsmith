import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe("Listv2 - Event bindings spec", () => {
  it("1. nested list - inner widget should have access to currentItem, currentIndex, currentView and level_1", () => {
    agHelper.AddDsl("Listv2/nestedList.json");
    // Open the property pane of button in the inner list widget
    entityExplorer.ExpandCollapseEntity("List1");
    entityExplorer.ExpandCollapseEntity("Container1");
    entityExplorer.ExpandCollapseEntity("List2");
    entityExplorer.ExpandCollapseEntity("Container2");
    entityExplorer.SelectEntityByName("Button3");
    // Enable JS mode for onClick
    propPane.ToggleJSMode("onClick", true);
    propPane.UpdatePropertyFieldValue(
      "onClick",
      "{{showAlert(`${level_1.currentView.Text1.text} _ ${level_1.currentItem.id} _ ${level_1.currentIndex} _ ${level_1.currentView.Input1.text} _ ${currentView.Input2.text}`)}}",
    );
    // Enter text in the parent list widget's text input
    agHelper
      .GetElement(locators._widgetByName("Input1"))
      .find("input")
      .type("outer input");

    // Enter text in the child list widget's text input in first row
    agHelper
      .GetElement(locators._widgetByName("Input2"))
      .find("input")
      .type("inner input");

    // click the button on inner list 1st row.
    agHelper
      .GetElement(locators._widgetByName("Button3"))
      .find("button")
      .click({ force: true });

    agHelper.ValidateToastMessage("Blue _ 001 _ 0 _ outer input _ inner input");
  });

  it("2. nested list - inner widget should get updated values of currentView and level_1", () => {
    // Enter text in the parent list widget's text input
    agHelper
      .GetElement(locators._widgetByName("Input1"))
      .find("input")
      .clear()
      .type("outer input updated");

    // Enter text in the child list widget's text input in first row
    agHelper
      .GetElement(locators._widgetByName("Input2"))
      .find("input")
      .clear()
      .type("inner input updated");

    // click the button on inner list 1st row.
    agHelper
      .GetElement(locators._widgetByName("Button3"))
      .find("button")
      .click({ force: true });
    agHelper.Sleep(1000);
    agHelper.ValidateToastMessage(
      "Blue _ 001 _ 0 _ outer input updated _ inner input updated",
    );
  });
});
