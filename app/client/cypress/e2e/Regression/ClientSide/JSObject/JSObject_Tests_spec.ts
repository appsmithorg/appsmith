import HomePage from "../../../../locators/HomePage";
import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
  draggableWidgets,
  locators,
  debuggerHelper,
  dataSources,
  assertHelper,
  table,
} from "../../../../support/ee/ObjectsCore_EE";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("Validate JSObj", {}, () => {
  before(() => {});

  it("1. Verify adding/deleting JSObject and more actions options", () => {
    jsEditor.CreateJSObject(
      `setInterval(() => {
        showAlert("Hi", "success")
    }, 2500, "Int")`,
      {
        paste: true,
        completeReplace: false,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("myFun1");

    // Add new JSObject
    PageList.AddNewPage("New blank page");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.GetNClick(locators._createNew);
    agHelper.GetNClick(jsEditor._addJSObj);
    agHelper.AssertContains("JSObject2", "exist", entityExplorer._entityName);
    agHelper.GetNClick(EditorNavigation.locators.MinimizeBtn);
    EditorNavigation.CloseAnnouncementModal();
    // List view
    agHelper.GetNClick('[data-testid="t--list-toggle"]');
    agHelper.AssertContains("JSObject1", "exist", entityExplorer._entityName);
    agHelper.AssertContains("JSObject2", "exist", entityExplorer._entityName);
    // Verify menu item in List view
    agHelper.GetNClick(jsEditor._jsPageActions, 0, true);
    agHelper.AssertContains("Rename", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Show bindings", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Copy to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Move to page", "exist", HomePage.portalMenuItem);
    agHelper.AssertContains("Delete", "exist", HomePage.portalMenuItem);

    // Add JSObj in List view
    agHelper.GetNClick(jsEditor._addJSObj, 0, true);
    agHelper.GetNClick(EditorNavigation.locators.MaximizeBtn);
    agHelper.AssertContains("JSObject2", "exist", entityExplorer._entityName);

    // Delete JSObj
    agHelper.GetNClick(jsEditor._addJSObj, 0, true);
    agHelper.GetNClick(jsEditor._moreActions, 0, true);
    agHelper.GetNClickByContains(HomePage.portalMenuItem, "Delete");
    agHelper.GetNClickByContains(HomePage.portalMenuItem, "Are you sure?");
    agHelper.ValidateToastMessage("JSObject4 deleted successfully");

    // Verify Copy to Page
    // agHelper.GetNClick(jsEditor._moreActions, 0, true);
    // agHelper.GetNClickByContains(HomePage.portalMenuItem, "Copy to page");
    // agHelper.GetNClickByContains(HomePage.portalMenuItem, "Page1");
    // agHelper.ValidateToastMessage(
    //   "JSObject3 copied to page Page1 successfully",
    // );
    // agHelper.AssertContains("JSObject3", "exist", entityExplorer._entityName);

    // Verify Rename
    // agHelper.GetNClick(jsEditor._moreActions, 0, true);
    // agHelper.AssertContains("Rename", "exist", HomePage.portalMenuItem);
    // agHelper.GetNClickByContains(HomePage.portalMenuItem, 'Rename');
    // agHelper.ClearNType('[value="JSObject3"]', 'JSObject3New');
    // agHelper.AssertContains("JSObject3New", "exist", entityExplorer._entityName);
    // agHelper.AssertContains("Copy to page", "exist", HomePage.portalMenuItem);
  });

  it("2. Verify alert message on page load and adding Function 2 to remove message", () => {
    // Verify alert message on page load
    EditorNavigation.NavigateToPage("Page1", true);
    agHelper.ValidateToastMessage("Hi");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    jsEditor.CreateJSObject(`clearInterval("Int")`, {
      paste: true,
      completeReplace: false,
      shouldCreateNewJSObj: false,
      lineNumber: 10,
    });
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.WaitUntilAllToastsDisappear();
  });

  it("3. Verify moving JSObject to new page", () => {
    // Verify Move to Page
    agHelper.GetNClick(jsEditor._moreActions, 0, true);
    agHelper.HoverElement(
      `${HomePage.portalMenuItem}:contains("Move to page")`,
    );
    agHelper.GetNClick(`${HomePage.portalMenuItem}:contains("Page2")`);

    EditorNavigation.NavigateToPage("Page1", true);
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.AssertElementAbsence('.t--entity-name:contains("JSObject1")');
  });

  it("4. Verify JSObject binding", () => {
    EditorNavigation.NavigateToPage("Page2", true);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 100);
    propPane.EnterJSContext("onClick", "{{JSObject11.myFun1();}}", true, false);
    agHelper.GetNClick(locators._widgetInDeployed("buttonwidget"));
    agHelper.ValidateToastMessage("Hi");
  });

  it("5. Verify JSObject Coalescing Logs", () => {
    PageList.AddNewPage("New blank page");
    jsEditor.CreateJSObject(
      `// Basic example using nullish coalescing operator
      const userProvidedValue = null; 
      const defaultValue = "Default Value";
      
      const finalValue = userProvidedValue ?? defaultValue;
      
      console.log(finalValue);`,
      {
        paste: true,
        completeReplace: false,
        shouldCreateNewJSObj: true,
        lineNumber: 5,
      },
    );
    jsEditor.RenameJSObjFromExplorer("JSObject1", "Coalescing");
    agHelper.GetNClick(jsEditor.runButtonLocator);
    agHelper.GetNClick(debuggerHelper.locators._logsTab);
    debuggerHelper.DoesConsoleLogExist("Default Value");
  });

  it("6. Verify JSObject Typecasting", () => {
    // typecasting a string to a number
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          const stringNumber = "42";
          const actualNumber = Number(stringNumber); 
      
          console.log(typeof stringNumber); 
          console.log(typeof actualNumber);  
          console.log(actualNumber);  
      
          const numberValue = 100;
          const stringValue = String(numberValue);
      
          console.log(typeof numberValue);
          console.log(typeof stringValue);
          console.log(stringValue);
        }
      }   
      `,
      {
        paste: true,
        completeReplace: true,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.RenameJSObjFromExplorer("JSObject1", "Typecasting");
    agHelper.GetNClick(jsEditor.runButtonLocator);
    agHelper.GetNClick(debuggerHelper.locators._logsTab);
    debuggerHelper.DoesConsoleLogExist("string");
    debuggerHelper.DoesConsoleLogExist("number");
    debuggerHelper.DoesConsoleLogExist("42");

    // typecasting a number to a string
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          const numberValue = 100;
          const stringValue = String(numberValue);
      
          console.log(typeof numberValue);
          console.log(typeof stringValue);
          console.log(stringValue);
        }
      }   
      `,
      {
        paste: true,
        completeReplace: true,
        shouldCreateNewJSObj: true,
        lineNumber: 5,
      },
    );
    agHelper.GetNClick(jsEditor.runButtonLocator);
    agHelper.GetNClick(debuggerHelper.locators._logsTab);
    debuggerHelper.DoesConsoleLogExist("number");
    debuggerHelper.DoesConsoleLogExist("string");
    debuggerHelper.DoesConsoleLogExist("100");
  });

  it("7. Verify Promise", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1 () {
          // Create a promise that simulates an asynchronous operation
          const myPromise = new Promise((resolve, reject) => {
            const success = true; // You can change this to false to simulate a rejection
      
            setTimeout(() => {
              if (success) {
                resolve("Operation was successful!"); // Fulfill the promise
              } else {
                reject("Operation failed."); // Reject the promise
              }
            }, 2000); // Simulate a 2-second delay
          });
      
          // Handle the promise
          myPromise
            .then((message) => {
            console.log(message); // Output: "Operation was successful!" if fulfilled
          })
            .catch((error) => {
            console.log(error); // Output: "Operation failed." if rejected
          });
        }
      }     
      `,
      {
        paste: true,
        completeReplace: true,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.RenameJSObjFromExplorer("JSObject2", "Pr");
    agHelper.GetNClick(jsEditor.runButtonLocator);
    agHelper.GetNClick(debuggerHelper.locators._logsTab);
    debuggerHelper.DoesConsoleLogExist("Operation was successful!");
  });

  it("8. Verify Queries", () => {
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved(" ");
    agHelper.TypeIntoTextArea(locators._codeEditorTarget, "/");
    agHelper.GetNAssertContains(locators._hints, "Coalescing");
    agHelper.GetNAssertContains(locators._hints, "Typecasting");
    agHelper.GetNAssertContains(locators._hints, "Pr");
    agHelper.GetNAssertContains(locators._hints, "JSObject1");
    agHelper.GetNAssertContains(locators._hints, "MainContainer");

    cy.get("@guid").then((uid) => {
      dataSources.GeneratePageForDS(`Postgres ${uid}`);
    });
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.ClickButton("Got it");
    assertHelper.AssertNetworkStatus("@updateLayout", 200);
    agHelper.Sleep(2000);
    table.WaitUntilTableLoad(0, 0, "v2");
    EditorNavigation.SelectEntityByName("SelectQuery", EntityType.Query);
    agHelper.GetNClick(locators._codeEditorTarget);
    agHelper.AssertElementVisibility(locators._evaluatedValue);

    cy.get(`${locators._codeMirrorCode} pre`).then(($elements) => {
      const text = [...$elements].map((el) => el.innerText).join("");
      agHelper.GetText(locators._evaluatedValue).then((evalText: any) => {
        expect(evalText.replace(/\n/g, "")).to.eq(text);
      });
    });
  });
  //Bug: https://github.com/appsmithorg/appsmith/issues/35385
  it.skip("9. Verify JSObject with identical name should not exist Bug: #35385", () => {
    for (let i = 0; i < 10; i++) {
      agHelper.GetNClick(locators._createNew, 0, true, 0);
    }
    agHelper.AssertElementAbsence(locators._toastMsg);
  });

  //Bug: https://github.com/appsmithorg/appsmith/issues/38216
  it.skip("10. Verify selecting JSObject does not change the page", () => {
    PageList.AddNewPage("New blank page");
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.GetNClick(locators._createNew);
    agHelper.AssertContains("JSObject1", "exist", entityExplorer._entityName);
    agHelper.GetNClick(jsEditor._addJSObj);
    agHelper.AssertContains("JSObject2", "exist", entityExplorer._entityName);
    EditorNavigation.NavigateToPage("Page1", true);
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    agHelper.GetNClick(locators._editorTab);
    PageList.VerifyIsCurrentPage("Page1");
    EditorNavigation.NavigateToPage("Page2", true);
    agHelper.AssertContains("JSObject1", "exist", entityExplorer._entityName);
    agHelper.GetNClick(locators._editorTab);
    PageList.VerifyIsCurrentPage("Page2");
  });
});
