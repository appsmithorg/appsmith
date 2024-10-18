const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const dslWithCurrencyWidget = require("../../../../../../fixtures/Listv2/simpleListWithCurrencyWidget.json");
import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  draggableWidgets,
  deployMode,
} from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";
// TODO: Test for Reset functionality
const items = JSON.parse(dsl.dsl.children[0].listData);

describe("Input Widgets", { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] }, function () {
  before(() => {
    agHelper.AddDsl("Listv2/simpleLargeListv2");
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Input Widgets default value", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 100); //for test #2
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.CURRENCY_INPUT,
      200,
      100,
    );
    propPane.UpdatePropertyFieldValue("Default value", "{{currentItem.id}}");
    propPane.TogglePropertyState("Required", "On");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 200); //for test #2
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.PHONE_INPUT,
      200,
      200,
    );
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{currentItem.phoneNumber}}",
    );
    propPane.TogglePropertyState("Required", "On");
    propPane.TogglePropertyState("Enable formatting", "Off");

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 300); //for test #2
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 300);
    propPane.UpdatePropertyFieldValue("Default value", "{{currentItem.email}}");
    propPane.TogglePropertyState("Required", "On");

    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.INPUT_V2) +
        " " +
        locators._inputField,
      "val",
      items[0].email,
    );

    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.CURRENCY_INPUT) +
        " " +
        locators._inputField,
      "val",
      items[0].id.toString(),
    );
    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.PHONE_INPUT) +
        " " +
        locators._inputField,
      "val",
      items[0].phoneNumber.toString(),
    );
  });

  it("2. Input Widgets isValid", function () {
    // Test for isValid === True
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
    propPane.RenameWidget("Text1", "Currency_Widget");
    agHelper.Sleep();
    propPane.UpdatePropertyFieldValue(
      "Text",
      "{{currentView.CurrencyInput1.isValid}}",
    );
    agHelper.AssertText(
      propPane._widgetToVerifyText("Currency_Widget"),
      "text",
      "true",
    );

    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    propPane.RenameWidget("Text2", "PhoneInput_Widget");
    agHelper.Sleep();
    propPane.UpdatePropertyFieldValue(
      "Text",
      "{{currentView.PhoneInput1.isValid}}",
    );
    agHelper.AssertText(
      propPane._widgetToVerifyText("PhoneInput_Widget"),
      "text",
      "true",
    );

    EditorNavigation.SelectEntityByName("Text3", EntityType.Widget);
    propPane.RenameWidget("Text3", "Input_Widget");
    agHelper.Sleep();
    propPane.UpdatePropertyFieldValue("Text", "{{currentView.Input1.isValid}}");
    agHelper.AssertText(
      propPane._widgetToVerifyText("Input_Widget"),
      "text",
      "true",
    );

    // Test for isValid === false
    deployMode.DeployApp();
    // cy.get(`${widgetSelectorByType("inputwidgetv2")} input`).clear({
    //   force: true,
    // });
    agHelper.ClearTextField(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
        " " +
        locators._inputField,
      true,
    );
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.TEXT),
      "text",
      "false",
      2,
    );

    agHelper.ClearTextField(
      locators._widgetInDeployed(draggableWidgets.PHONE_INPUT) +
        " " +
        locators._inputField,
      true,
    );
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.TEXT),
      "text",
      "false",
      1,
    );

    agHelper.ClearTextField(
      locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT) +
        " " +
        locators._inputField,
      true,
    );
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.TEXT),
      "text",
      "false",
    );
    deployMode.NavigateBacktoEditor();
  });

  it("3. Currency widget default value is retained over page change", () => {
    const value = "123456789";
    const formattedText = "123,456,789";

    cy.addDsl(dslWithCurrencyWidget);
    cy.openPropertyPane("currencyinputwidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", value);

    // Observe the value of 2nd item currency widget - formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", formattedText);

    // Find the 2nd item currency and click to focus
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .click({ force: true });

    // Observe the value of 2nd item currency widget - un-formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", value);

    // Change to page 2
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("2")
      .click({ force: true })
      .wait(500);

    // Back to page 1
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("1")
      .click({ force: true })
      .wait(500);

    // Observe the value of 2nd item currency widget - formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", formattedText);
  });
});
