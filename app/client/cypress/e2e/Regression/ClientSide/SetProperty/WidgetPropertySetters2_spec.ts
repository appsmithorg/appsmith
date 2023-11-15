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

describe("Widget Property Setters - Part II - Tc #2409", () => {
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

  it("2. Update Visible property via JS function - using appmsith store", () => {
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

  it("3. Update Input value via JS function - using async await - Api call", () => {
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
    agHelper.Sleep(3000); //for the Api to run & new value to be set, for CI runs
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

  it("4. Update Input value via JS Call back function - in Edit mode itself + OnPage load", () => {
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

    entityExplorer.SelectEntityByName("Input1");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      "{{appsmith.user.name}}",
    );
    deployMode.DeployApp(); //below validates the Page load
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

  it("5. Update Widget property through framework function - Settimeout", () => {
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        async myFun1 () {
          setTimeout(()=>{Button1.isVisible ?Button1.setVisibility(false):Button1.setVisibility(true)},2000)
        }
      }`,
      false,
    );
    jsEditor.EnableDisableAsyncFuncSettings("myFun1", true, false);
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.BUTTON), //Asserting before setTimeout JS function execution, button is visible
    );
    agHelper.Sleep(2000); //waiting for settimeout to execute
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
  });

  it("6. Verify SetWidget for unsupported properties - setPlaying(Audio widget) property for Button, set property via try/catch block", () => {
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          Button1.setPlaying(true);
        },
      }`,
      false,
    );
    agHelper.AssertElementVisibility(locators._lintErrorElement);
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains(`"setPlaying" doesn't exist in Button1`);

    //try catch block
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        myFun1 () {
          try {
            Api1.run().then(()=>{ Button1.setVisibility(false)})
          }
          catch(e)
          { showAlert(e.message) }
        },
      }`,
      false,
    );
    deployMode.DeployApp();
    agHelper.Sleep(3000); //for the Api to run & button to disappear, for CI runs
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
  });

  it("7.Update set property using mutative values", () => {
    entityExplorer.SelectEntityByName("Button1");
    propPane.TogglePropertyState("Visible", "Off"); //due to bug, element state is not altereed when set via settimeout
    propPane.TogglePropertyState("Visible", "On");
    entityExplorer.SelectEntityByName("JSObject1");
    jsEditor.EditJSObj(
      `export default {
        var1: [true,false,true,false],
        async myFun1() {
          for (let i =0; i<=this.var1.length;i++){
            Input1.setVisibility(this.var1[i]);
          }
        },
      }`,
      false,
    );
    jsEditor.EnableDisableAsyncFuncSettings("myFun1", false, false);
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2), //Asserting before setTimeout JS function execution, Input is visible
    );
    agHelper.ClickButton("Submit");
    agHelper.AssertElementAbsence(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2),
    );
  });

  afterEach(() => {
    deployMode.NavigateBacktoEditor();
  });
});
