import {
  PROPERTY_SELECTOR,
  WIDGET,
  getWidgetSelector,
} from "../../../../locators/WidgetLocators";

import {
  entityExplorer,
  jsEditor,
  agHelper,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Linting warning for imperative store update", function () {
  it("Shows lint error for imperative store update", function () {
    entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
    entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 400, 400);

    agHelper.GetNClick(getWidgetSelector(WIDGET.BUTTON));
    propPane.TypeTextIntoField("Label", "{{appsmith.store.name = 6}}");

    //Mouse hover to exact warning message
    agHelper.AssertElementVisibility(locators._lintErrorElement);
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains("Use storeValue() method to modify the store");
    agHelper.Sleep();

    //Create a JS object
    jsEditor.CreateJSObject(
      `export default {
          myFun1: () => {
            appsmith.store.name.text = 6
          },
        }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );

    agHelper.AssertElementVisibility(locators._lintErrorElement);
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains("Use storeValue() method to modify the store");
    agHelper.Sleep();
  });
});
