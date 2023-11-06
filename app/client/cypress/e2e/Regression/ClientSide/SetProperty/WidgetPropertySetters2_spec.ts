import {
  entityExplorer,
  jsEditor,
  agHelper,
  locators,
  propPane,
  draggableWidgets,
  deployMode,
  apiPage,
  dataManager,
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
      locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT) +
        " " +
        locators._input,
      "val",
      "99",
    );
  });

  it("2. Update Visible property via JS function", () => {
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
      myFun1 () {
        appsmith.store.currencyVal>90 ? CurrencyInput1.setVisibility(false):CurrencyInput1.setVisibility(true);
      }
    }`,
      false,
    );
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT), //Asserting before JS function execution, should be visible
    );
    agHelper.ClickButton("Submit");
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT),
    );
  });

  it("3. Update Input value via JS function", () => {
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 300, 300);
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        async myFun1 () {
          let local = await Api1.run().then((data)=> data.map((user) =>
                                                              {return {
                                                                name: user.name,
                                                                id: user.id,
                                                                status: user.status,
                                                              }
                                                              }));
          Input1.setValue(local[5].name);
        }
      }`,
      false,
    );
    deployMode.DeployApp();
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).be.empty;
      });
    agHelper.ClickButton("Submit");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).not.be.empty;
      });
  });

  it("4. Update Input value via JS function run", () => {
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        async myFun1 () {
          let local = await Api1.run().then((data)=> data.map((user) =>
                                                              {return {
                                                                name: user.name,
                                                                id: user.id,
                                                                email: user.email,
                                                              }
                                                              }));
          Input1.setValue(local[5].email);
        }
      }`,
      false,
    );
    jsEditor.RunJSObj();
    entityExplorer.SelectEntityByName("Page1");
    agHelper
      .GetText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) +
          " " +
          locators._input,
        "val",
      )
      .then((val) => {
        expect(val).contains("@");
      });
    deployMode.DeployApp();
  });

  // it("5. Update Widget property value during OnPage load", () => {
  //   //
  // });

  afterEach(() => {
    deployMode.NavigateBacktoEditor();
  });
});
