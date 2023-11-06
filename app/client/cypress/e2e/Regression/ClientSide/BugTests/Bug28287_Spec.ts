import {
  dataSources,
  agHelper,
  entityExplorer,
  propPane,
  debuggerHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;
let queryName: string;

describe("Bug 28287: Binding query to widget, check query response in query editor on page load", function () {
  before("Drag drop a text widget", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
  });

  it("1. Check query response in query editor on page load", () => {
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

      agHelper.AssertElementVisibility(dataSources._queryResponse("TABLE"));
    });
  });
});
