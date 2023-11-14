import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  SidebarButton,
} from "../../../../support/Pages/EditorNavigation";

let datasourceName;

describe("Add widget - Postgress DataSource", function () {
  beforeEach(() => {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
    EditorNavigation.ViaSidebar(SidebarButton.Pages);
  });

  it("1. Validate Snipping with query and table widget on canvas", () => {
    _.autoLayout.ConvertToAutoLayoutAndVerify(false);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    _.dataSources.EnterQuery("select * from public.configs");
    cy.WaitAutoSave();
    cy.runQuery();
    _.dataSources.AddSuggestedWidget(Widgets.Table);
    cy.isSelectRow(1);
    cy.readTableV2dataPublish("1", "0").then((tabData) => {
      cy.log("the value is " + tabData);
      expect(tabData).to.be.equal("5");
    });
  });
});
