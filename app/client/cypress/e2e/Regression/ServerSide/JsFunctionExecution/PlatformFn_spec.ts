import {
  agHelper,
  apiPage,
  jsEditor,
  debuggerHelper,
  dataManager,
  locators,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation from "../../../../support/Pages/EditorNavigation";

describe(
  "Tests functionality of platform function",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    it("1. Tests access to outer variable", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "getAllUsers",
      );
      jsEditor.CreateJSObject(
        `export default {
        myFun1: () => {

        },
        myFun2: async () => {

        },
        accessOuterVariableInsideSuccessCb: () => {
          const outer = "World";
          getAllUsers.run(() => {
            showAlert("Hello " + outer + " from success callback");
          });
        },
        accessOuterVariableInsideSetIntervalCb: async () => {
          const outer = "World";
          setInterval(() => {
            showAlert("Hello " + outer +" from setInterval");
            clearInterval("test");
          }, 1000, "test")
        },
        accessOuterVariableInsideGeoCb: async () => {
          const outer = "World";
          appsmith.geolocation.getCurrentPosition(() => {
            showAlert("Hello " + outer+ " from current position");
          });
        },
        metaDataForSetInterval: () => {
          setInterval(() => {
            console.log("Hello from setInterval");
            clearInterval("test345")
          }, 3000, "test345");
        },
        metaDataForSetTimeout: () => {
          setTimeout(() => {
            console.log("Hello from setTimeout");
          }, 4000);
        },
        metaDataApiTest: () => {
          getAllUsers.run().then(() => {
            setTimeout(() => {
              console.log("Hello from setTimeout inside API")
            }, 2000);
          })
        },
        switchMetaData: () => {},
        accessSetIntervalFromSetTimeout: () => {
          setTimeout(() => {
            setInterval(() => {
              showAlert("Hello World from setInterval inside setTimeout");
              clearInterval("test123");
            }, 1000, "test123");
          }, 1000);
        },
        executeTriggersOutsideReqResCycle: () => {
          showAlert("Hello").then(() => getAllUsers.run(() => showAlert("World")));
        }
    }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: false,
        },
      );
      agHelper.Sleep(4000);
      cy.url().then((url) => {
        cy.visit(url, {
          onBeforeLoad: (win) => {
            const latitude = 48.71597183246423;
            const longitude = 21.255670821215418;
            cy.stub(
              win.navigator.geolocation,
              "getCurrentPosition",
            ).callsArgWith(0, {
              coords: { latitude, longitude },
            });
          },
        });

        jsEditor.SelectFunctionDropdown("accessOuterVariableInsideGeoCb");
        jsEditor.RunJSObj();
        agHelper.AssertContains("Hello World from current position", "exist");

        jsEditor.SelectFunctionDropdown("accessOuterVariableInsideSuccessCb");
        jsEditor.RunJSObj();
        agHelper.AssertContains("Hello World from success callback", "exist");
        jsEditor.SelectFunctionDropdown(
          "accessOuterVariableInsideSetIntervalCb",
        );
        jsEditor.RunJSObj();
        agHelper.AssertContains("Hello World from setInterval", "exist");
        jsEditor.SelectFunctionDropdown("accessSetIntervalFromSetTimeout");
        jsEditor.RunJSObj();
        agHelper.AssertContains(
          "Hello World from setInterval inside setTimeout",
          "exist",
        );
        jsEditor.SelectFunctionDropdown("executeTriggersOutsideReqResCycle");
        jsEditor.RunJSObj();
        agHelper.AssertContains("Hello", "exist");
        agHelper.AssertContains("World", "exist");

        // Test for meta data
        jsEditor.SelectFunctionDropdown("metaDataForSetTimeout");
        jsEditor.RunJSObj();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(4000);
        agHelper.GetNClick(jsEditor._logsTab);
        debuggerHelper.DebuggerLogsFilter("JSObject1.metaDataForSetTimeout");
        debuggerHelper.DoesConsoleLogExist("Hello from setTimeout");

        jsEditor.SelectFunctionDropdown("metaDataForSetInterval");
        jsEditor.RunJSObj();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(3000);
        agHelper.GetNClick(jsEditor._logsTab);
        debuggerHelper.DebuggerLogsFilter("JSObject1.metaDataForSetInterval");
        debuggerHelper.DoesConsoleLogExist("Hello from setInterval");

        jsEditor.SelectFunctionDropdown("metaDataApiTest");
        jsEditor.RunJSObj();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(2000);
        agHelper.GetNClick(jsEditor._logsTab);
        debuggerHelper.DebuggerLogsFilter("JSObject1.metaDataApiTest");
        debuggerHelper.DoesConsoleLogExist("Hello from setTimeout inside API");
      });
    });

    it("2.Bug 16135 ShowAlert with same texts, when invoked from different triggers are combined", () => {
      jsEditor.CreateJSObject(
        `export default {
        showTwoSameToastMessageAlerts: () => {
            showAlert( "Hello World" );
            showAlert( "Hello World" );
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
      agHelper.Sleep();
      jsEditor.RunJSObj();
      agHelper.AssertElementLength(locators._toastMsg, 2);
      agHelper.ValidateToastMessage("Hello World", 0);
      agHelper.ValidateToastMessage("Hello World", 1);
    });

    it("3. Bug 30121 Reset widget should reset children as well when resetChildren argument is set to true", () => {
      EditorNavigation.ShowCanvas();
      agHelper.AddDsl("resetWidgetDSL");
      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "Hello! How are you?",
        0,
      );

      agHelper.ClickButton("ResetContainer");

      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "text",
        "",
        0,
      );

      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "Hello! How are you?",
        1,
      );

      agHelper.ClearNType(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "Hello! How are you?",
        2,
      );

      agHelper.ClickButton("ResetList");

      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "text",
        "",
        1,
      );

      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
        "text",
        "",
        2,
      );
    });
  },
);
