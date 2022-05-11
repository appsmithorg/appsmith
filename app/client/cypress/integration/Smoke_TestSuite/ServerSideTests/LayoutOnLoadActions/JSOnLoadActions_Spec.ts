import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, jsName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it("1. Create Postgress DS & the query", function() {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane(guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();
    });
  });

  it("2. Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject - 54, 55", function() {
    jsEditor.CreateJSObject(
      `export default {
      getId: async () => {
        return 8;
      }
    }`,
      true,
      true,
      false,
    );
    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true); //Only before calling confirmation is enabled by User here
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("GetUser");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{" +
          jsObjName +
          ".getId.data}}",
      );
      ee.SelectEntityByName("Table1", "WIDGETS");
      jsEditor.EnterJSContext("Table Data", "{{GetUser.data}}");
      agHelper.ValidateToastMessage(
        (("[" + jsName) as string) +
          ".getId, GetUser] will be executed automatically on page load",
      );
      agHelper.DeployApp();
      agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
      agHelper.AssertElementPresence(
        jsEditor._dialogBody((jsName as string) + ".getId"),
      );
      agHelper.ClickButton("Yes");
      agHelper.Sleep(1000);
    });
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("3. Verify OnPage Load - auto enabled from above case for JSOBject - 54, 55", function() {
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    //agHelper.Sleep(1000);
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.VerifyAsyncFuncSettings("getId", true, true);
  });

  it("4. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true);
    agHelper.DeployApp();
    agHelper.ValidateToastMessage('The action "GetUser" has failed');
    agHelper.NavigateBacktoEditor();
  });

  it("5. Verify OnPage Load - Enabling back & Before Function calling disabled for JSOBject - 53", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, false);
    agHelper.DeployApp();
    agHelper.AssertElementAbsence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementAbsence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("6. Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject - 55", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, true);
    agHelper.DeployApp();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
  });

  it("7. Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No in Confirmation dialog - 56", function() {
    agHelper.DeployApp();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("Failed to execute actions during page load"); //When Confirmation is NO
    table.WaitForTableEmpty();
    cy.reload();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
  });

  it("8. Verify that JS editor function has a settings button available for functions marked async - 51, 52", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {	},
        myFun2: async () => {	},
        myFun3: async () => {	},
        myFun4: async () => {	},
        myFun5: async () => {	},
        myFun6: async () => {	},
        myFun7: () => {	},
      }`,
      true,
      true,
      false,
    );

    jsEditor.VerifyAsyncFuncSettings("myFun2", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun3", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun4", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun5", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun6", false, false);

    VerifyFunctionDropdown(
      ["myFun1", "myFun7"],
      [
        "myFun2Async",
        "myFun3Async",
        "myFun4Async",
        "myFun5Async",
        "myFun6Async",
      ],
    );
  });



  function VerifyFunctionDropdown(
    syncFunctions: string[],
    asyncFunctions: string[],
  ) {
    cy.get(jsEditor._funcDropdown).click();
    cy.get(jsEditor._funcDropdownOptions).then(function($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(syncFunctions);
      expect($ele.eq(1).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(2).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(3).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(4).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(5).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(6).text()).to.be.oneOf(syncFunctions);
    });
    cy.get(jsEditor._funcDropdown).click();
  }
});
