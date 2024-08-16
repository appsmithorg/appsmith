import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

let datasourceName;

describe(
  "Add widget - Postgress DataSource",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    beforeEach(() => {
      _.dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("1. Validate Snipping with query and table widget on canvas", () => {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      _.dataSources.CreateQueryForDS(
        datasourceName,
        "select * from public.configs",
      );
      cy.WaitAutoSave();
      cy.runQuery();
      _.dataSources.AddSuggestedWidget(Widgets.Table);
      _.table.SelectTableRow(1, 0, true, "v2");
      cy.readTableV2dataPublish("1", "0").then((tabData) => {
        cy.log("the value is " + tabData);
        expect(tabData).to.be.equal("5");
      });
    });
  },
);
