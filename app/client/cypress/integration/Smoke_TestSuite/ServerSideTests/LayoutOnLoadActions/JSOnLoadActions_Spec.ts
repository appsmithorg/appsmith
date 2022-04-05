import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsl: any;
let guid: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  homePage = ObjectsRegistry.HomePage,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  dataSources = ObjectsRegistry.DataSources,
  locator = ObjectsRegistry.CommonLocators,
  jsEditor = ObjectsRegistry.JSEditor;
describe("Layout OnLoad Actions tests", function() {
  before(() => {
    cy.fixture("paramsDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. With Optional chaining : {{ this?.params?.condition }}", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.FillPostgresDSForm();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      agHelper.RenameWithInPane(guid, false);
      dataSources.TestSaveDatasource();
      cy.log("ds name is :" + guid);
      dataSources.NavigateToActiveDSQueryPane(guid);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("GetUser");
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{JSObject1.getPostId.data}} order by id",
      );
      jsEditor.CreateJSObject(
        `export default {
  getPostId: async () => {
    return 352;
  },
};
`,
        true,
        true,
        false,
      );
    });
    ee.expandCollapseEntity("WIDGETS");
    ee.SelectEntityByName("Table1");
    jsEditor.EnterJSContext("tabledata", "{{GetUser.data}}");
    // table.ReadTableRowColumnData(0, 0).then((cellData) => {
    //   expect(cellData).to.be.equal("8");
    // });
    //agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    // table.ReadTableRowColumnData(0, 0).then((cellData) => {
    //   expect(cellData).to.be.equal("7");
    // });
    agHelper.DeployApp();
  });
});
