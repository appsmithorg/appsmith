import {
  agHelper,
  apiPage,
  jsEditor,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Tests functionality of platform function", () => {
  it("1. Tests access to outer variable", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"], "getAllUsers");
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
        debuggerHelper.ClickDebuggerIcon();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(4000);
        debuggerHelper.filter("JSObject1.metaDataForSetTimeout");
        debuggerHelper.DoesConsoleLogExist("Hello from setTimeout");

        jsEditor.SelectFunctionDropdown("metaDataForSetInterval");
        jsEditor.RunJSObj();
        debuggerHelper.ClickDebuggerIcon();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(3000);
        debuggerHelper.filter("JSObject1.metaDataForSetInterval");
        debuggerHelper.DoesConsoleLogExist("Hello from setInterval");

        jsEditor.SelectFunctionDropdown("metaDataApiTest");
        jsEditor.RunJSObj();
        debuggerHelper.ClickDebuggerIcon();
        agHelper.GetNClick(jsEditor._logsTab);
        jsEditor.SelectFunctionDropdown("switchMetaData");
        jsEditor.RunJSObj();
        agHelper.Sleep(2000);
        debuggerHelper.filter("JSObject1.metaDataApiTest");
        debuggerHelper.DoesConsoleLogExist("Hello from setTimeout inside API");
      });
    });
  });
});
