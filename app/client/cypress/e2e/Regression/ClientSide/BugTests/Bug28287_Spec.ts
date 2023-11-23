import {
  agHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

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

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", `{{${queryName}.data}}`);

      agHelper.RefreshPage();

      agHelper.Sleep(1000);

      EditorNavigation.SelectEntityByName(queryName, EntityType.Query);

      agHelper.AssertElementVisibility(dataSources._queryResponse("TABLE"));
    });
  });
});
