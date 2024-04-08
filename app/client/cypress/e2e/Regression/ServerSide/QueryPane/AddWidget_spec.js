import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import { dataSources } from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;

describe(
  "Add widget - Postgress DataSource",
  { tags: ["@tag.Datasource"] },
  function () {
    beforeEach(() => {
      cy.startRoutesForDatasource();
      cy.createPostgresDatasource();
      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = httpResponse.response.body.data.name;
      });
    });

    it("1. Verify 'Add to widget [Widget Suggestion]' functionality - Postgress", () => {
      dataSources.CreateQueryForDS(
        datasourceName,
        "select * from public.configs",
      );
      cy.WaitAutoSave();
      cy.runQuery();
      dataSources.AddSuggestedWidget(Widgets.Table);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.isSelectRow(1);
      cy.readTableV2dataPublish("1", "0").then((tabData) => {
        cy.log("the value is " + tabData);
        expect(tabData).to.be.equal("5");
      });
    });
  },
);
