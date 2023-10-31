import {
  entityExplorer,
  jsEditor,
  agHelper,
  locators,
  propPane,
  draggableWidgets,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Widget Property Setters - Part II", () => {
  it("1. Bug 25287 - CurrencyInput does not update value when set using CurrencyInput.text", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CURRENCY_INPUT);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 200);

    //Create a JS object
    jsEditor.CreateJSObject(
      `export default {
        myFun1 () {
          storeValue('currencyVal', 99)
          CurrencyInput1.setValue(appsmith.store.currencyVal)}
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}");
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.AssertText(
      locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT) +" input",
      "val",
      "99",
    );
  });
});
