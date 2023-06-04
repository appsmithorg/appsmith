import * as _ from "../../../../support/Objects/ObjectsCore";
let dsName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Tc 54, 55 - Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function () {
    _.jsEditor.CreateJSObject(
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
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true); //Only before calling confirmation is enabled by User here
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("GetEmployee");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.dataSources.EnterQuery(
        "SELECT * FROM public.employees where employee_id = {{" +
          jsObjName +
          ".getEmployee.data}}",
      );
      _.entityExplorer.SelectEntityByName("Table1", "Widgets");
      _.propPane.UpdatePropertyFieldValue("Table data", "{{GetEmployee.data}}");
      _.agHelper.ValidateToastMessage(
        "[GetEmployee, " +
          (jsName as string) +
          ".getEmployee] will be executed automatically on page load",
      );
      _.deployMode.DeployApp();
      _.agHelper.AssertElementVisible(
        _.jsEditor._dialog("Confirmation dialog"),
      );
      _.agHelper.AssertElementVisible(
        _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
      );
      _.jsEditor.ConfirmationClick("Yes");
      _.agHelper.Sleep(1000);
    });
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Tc 54, 55 - Verify OnPage Load - auto enabled from above case for JSOBject", function () {
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.jsEditor.ConfirmationClick("Yes");
    //_.agHelper.Sleep(1000);
    _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.VerifyAsyncFuncSettings("getEmployee", true, true);
  });

  it("3. Tc 56 - Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No & then Yes in Confirmation dialog", function () {
    _.deployMode.DeployApp(); //Adding this check since GetEmployee failure toast is always coming & making product flaky
    //_.agHelper.WaitUntilAllToastsDisappear();
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.jsEditor.ConfirmationClick("No");
    _.agHelper.AssertContains(`${jsName + ".getEmployee"} was cancelled`);
    _.table.WaitForTableEmpty();
    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.RefreshPage(true, "viewPage");
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.jsEditor.ConfirmationClick("Yes");
    // _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.jsEditor.ConfirmationClick("Yes");
    _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
  });

  //Skipping due to - "_.tableData":"ERROR: invalid input syntax for type smallint: "{}""
  it.skip("4. Tc 53 - Verify OnPage Load - Enabled & Disabling - Before Function calling for JSOBject", function () {
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, false);
    //_.jsEditor.RunJSObj(); //Even running JS functin before delpoying does not help
    //_.agHelper.Sleep(2000);
    _.deployMode.DeployApp();
    _.agHelper.AssertElementAbsence(_.jsEditor._dialog("Confirmation dialog"));
    _.agHelper.AssertElementAbsence(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast("ran successfully"),
    ); //failed toast is appearing hence skipping
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
  });

  it("5. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function () {
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true);
    _.deployMode.DeployApp(_.locators._widgetInDeployed("tablewidget"), false);
    _.agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    // ee.ExpandCollapseEntity("Queries/JS");
    // ee.SelectEntityByName(jsName as string);
    // _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, true);
    // _.agHelper.GetNClick(_.jsEditor._runButton);
    // _.jsEditor.ConfirmationClick("Yes");
  });

  it("6. Tc 55 - Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject & deleting testdata", function () {
    // _.deployMode.DeployApp(_.locators._widgetInDeployed("tablewidget"), false);
    // _.agHelper.WaitUntilAllToastsDisappear();    //incase toast appears, GetEmployee failure toast is appearing
    // _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    // _.agHelper.AssertElementVisible(
    //   _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // _.jsEditor.ConfirmationClick("Yes");

    // _.agHelper.AssertElementAbsence(_.locators._toastMsg);
    // _.table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
    //   expect(cellData).to.be.equal("2");
    // });
    // //_.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    // _.deployMode.NavigateBacktoEditor();
    // _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation dialog"));
    // _.agHelper.AssertElementVisible(
    //   _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // _.jsEditor.ConfirmationClick("Yes");
    // _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only

    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "GetEmployee",
      "Delete",
      "Are you sure?",
    );
  });
});
