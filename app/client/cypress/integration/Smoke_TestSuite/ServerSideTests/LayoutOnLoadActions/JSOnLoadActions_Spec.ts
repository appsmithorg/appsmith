import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, jsName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table;

describe("JSObjects OnLoad Actions tests", function () {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
  });

  it("1. Create Postgress DS & the query", function () {
    ee.NavigateToSwitcher("explorer");
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

  it("2. Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function () {
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
    jsEditor.EnableDisableOnPageLoad("getId", false, true); //Only before calling confirmation is enabled by User here
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("GetUser");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{" + jsObjName + ".getId.data}}",
      );
      ee.SelectEntityByName("Table1", 'WIDGETS');
      jsEditor.EnterJSContext("Table Data", "{{GetUser.data}}");
      agHelper.ValidateToastMessage("[" + jsName as string + ".getId, GetUser] will be executed automatically on page load")
      agHelper.DeployApp();
      agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
      agHelper.AssertElementPresence(jsEditor._dialogBody(jsName as string + ".getId"))
      agHelper.ClickButton("Yes");
      agHelper.Sleep(1000)
    });
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("3. Verify OnPage Load - auto enabeld from above case for JSOBject", function () {
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(jsEditor._dialogBody(jsName as string + ".getId"))
    agHelper.ClickButton("Yes");
    agHelper.Sleep(1000)
    ee.SelectEntityByName(jsName as string, 'QUERIES/JS')
    jsEditor.VerifyOnPageLoadSetting('getId', 'checked', 'checked')
  });

  it("4. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function () {
    ee.SelectEntityByName(jsName as string, 'QUERIES/JS')
    jsEditor.EnableDisableOnPageLoad("getId", false, true);
    agHelper.DeployApp();
    agHelper.ValidateToastMessage("The action \"GetUser\" has failed")
    agHelper.NavigateBacktoEditor();
  });

  it("5. Verify OnPage Load - Enabling back & Before Function calling disabled for JSOBject", function () {
    ee.SelectEntityByName(jsName as string, 'QUERIES/JS')
    jsEditor.EnableDisableOnPageLoad("getId", true, false);
    agHelper.DeployApp();
    agHelper.AssertElementAbsence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementAbsence(jsEditor._dialogBody(jsName as string + ".getId"))
    // agHelper.ClickButton("Yes");
    // agHelper.Sleep(1000)
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });
});
