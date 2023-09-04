import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;

describe("Add widget - Postgress DataSource", function () {
  beforeEach(() => {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
  });

  it("1. Validate Snipping with query and table widget on canvas", () => {
    cy.get(".t--close-editor span:contains('Back')").click({ force: true });
    cy.get(".t--back-button span:contains('Back')").click({ force: true });

    _.autoLayout.ConvertToAutoLayoutAndVerify(false);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    _.dataSources.EnterQuery("select * from public.configs");
    cy.WaitAutoSave();
    cy.runQuery();
    _.dataSources.AddSuggestedWidget(
      Widgets.Table,
      false,
      0,
      _.dataSources._addSuggestedAddNew,
    );
    cy.isSelectRow(0);
    cy.readTableV2dataPublish("0", "0").then((tabData) => {
      cy.log("the value is " + tabData);
      expect(tabData).to.be.equal("5");
    });
  });
});
