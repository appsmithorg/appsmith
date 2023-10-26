import {
  dataSources,
  agHelper,
  entityExplorer,
  propPane,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;
let queryName: string;

describe("Bug 28287: Binding query to widget, check query response in query editor on page load", function () {
  before("adds a text widget", () => {
    agHelper.AddDsl("textDsl");
  });

  it("1. Create datasources", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uuid) => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      queryName = `Query_${uuid}`;
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM users LIMIT 10",
        queryName,
      );
      dataSources.ToggleUsePreparedStatement(false);

      entityExplorer.SelectEntityByName("Text1");
      propPane.TypeTextIntoField("Text", `{{${queryName}.data}}`);

      agHelper.RefreshPage();

      agHelper.Sleep(1000);

      entityExplorer.SelectEntityByName(queryName, "Queries/JS");
      debuggerHelper.ClickDebuggerIcon();
      debuggerHelper.ClickResponseTab();

      agHelper.AssertElementVisibility(dataSources._queryResponse("TABLE"));
    });
  });
});
