import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  deployMode,
  dataSources,
  table,
  entityItems,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
let dsName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    agHelper.AddDsl("tablev1NewDsl");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    AppSidebar.navigate(AppSidebarButton.Editor);
  });

  it("1. Tc 54, 55 - Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function () {
    jsEditor.CreateJSObject(
      `export default {
      getEmployee: async () => {
        return 2;
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true); //Only before calling confirmation is enabled by User here
    dataSources.CreateQueryForDS(dsName, "", "GetEmployee");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      dataSources.EnterQuery(
        "SELECT * FROM public.employees where employee_id = {{" +
          jsObjName +
          ".getEmployee.data}}",
      );
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Table data", "{{GetEmployee.data}}");
      agHelper.ValidateToastMessage(
        "[GetEmployee, " +
          (jsName as string) +
          ".getEmployee] will be executed automatically on page load",
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
      agHelper.AssertElementVisibility(
        jsEditor._dialogBody((jsName as string) + ".getEmployee"),
      );
      jsEditor.ConfirmationClick("Yes");
      agHelper.Sleep(1000);
    });
    assertHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("2. Tc 54, 55 - Verify OnPage Load - auto enabled from above case for JSOBject", function () {
    agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    jsEditor.ConfirmationClick("Yes");
    //agHelper.Sleep(1000);
    agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    jsEditor.VerifyAsyncFuncSettings("getEmployee", true, true);
  });

  it("3. Tc 56 - Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No & then Yes in Confirmation dialog", function () {
    deployMode.DeployApp(); //Adding this check since GetEmployee failure toast is always coming & making product flaky
    //agHelper.WaitUntilAllToastsDisappear();
    agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    jsEditor.ConfirmationClick("No");
    agHelper.AssertContains(`${jsName + ".getEmployee"} was cancelled`);
    table.WaitForTableEmpty();
    agHelper.WaitUntilAllToastsDisappear();

    agHelper.RefreshPage("viewPage");
    agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    jsEditor.ConfirmationClick("Yes");
    // agHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    agHelper.AssertElementVisibility(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    jsEditor.ConfirmationClick("Yes");
    agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
  });

  //Skipping due to - "tableData":"ERROR: invalid input syntax for type smallint: "{}""
  it("4. Tc 53 - Verify OnPage Load - Enabled & Disabling - Before Function calling for JSOBject", function () {
    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, false);
    //jsEditor.RunJSObj(); //Even running JS functin before delpoying does not help
    //agHelper.Sleep(2000);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(jsEditor._dialog("Confirmation dialog"));
    agHelper.AssertElementAbsence(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    agHelper.AssertElementAbsence(locators._specificToast("ran successfully")); //failed toast is appearing hence skipping
    assertHelper.AssertNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("5. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function () {
    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true);
    deployMode.DeployApp(locators._widgetInDeployed("tablewidget"), false);
    agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    deployMode.NavigateBacktoEditor('The action "GetEmployee" has failed');
    //agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    // ee.ExpandCollapseEntity("Queries/JS");
    // ee.SelectEntityByName(jsName as string);
    // jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, true);
    // agHelper.GetNClick(jsEditor._runButton);
    // jsEditor.ConfirmationClick("Yes");
  });

  it("6. Tc 55 - Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject & deleting testdata", function () {
    // deployMode.DeployApp(locators._widgetInDeployed("tablewidget"), false);
    // agHelper.WaitUntilAllToastsDisappear();    //incase toast appears, GetEmployee failure toast is appearing
    // agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    // agHelper.AssertElementVisibility(
    //   jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // jsEditor.ConfirmationClick("Yes");

    // agHelper.AssertElementAbsence(locators._toastMsg);
    // table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
    //   expect(cellData).to.be.equal("2");
    // });
    // //agHelper.AssertNetworkExecutionSuccess("@postExecute");
    // deployMode.NavigateBacktoEditor();
    // agHelper.AssertElementVisibility(jsEditor._dialog("Confirmation dialog"));
    // agHelper.AssertElementVisibility(
    //   jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // jsEditor.ConfirmationClick("Yes");
    // agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only

    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: jsName as string,
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "GetEmployee",
      action: "Delete",
      entityType: entityItems.Query,
    });
  });
});
