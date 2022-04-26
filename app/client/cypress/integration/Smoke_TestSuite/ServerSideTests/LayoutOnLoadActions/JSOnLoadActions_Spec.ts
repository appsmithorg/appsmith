import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, jsName : any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
  });

  it("1. Verify OnPage Load & Before Function calling enabled for JSOBject", function() {
    ee.NavigateToSwitcher("explorer");
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
    jsEditor.EnableOnPageLoad("getId", false, true);
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane(guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();
      dataSources.NavigateToActiveDSQueryPane(guid);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("GetUser");
      cy.get("@jsObjName").then((jsObjName) => {
        jsName = jsObjName;
        agHelper.EnterValue(
          "SELECT * FROM public.users where id = {{" + jsObjName + ".getId.data}}",
        );;
      })
    });
    ee.SelectEntityByName("Table1", 'WIDGETS');
    jsEditor.EnterJSContext("Table Data", "{{GetUser.data}}");

    agHelper.DeployApp();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.ClickButton("Yes");
    agHelper.Sleep(1000)
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");

    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });

    agHelper.NavigateBacktoEditor();
  });
});
