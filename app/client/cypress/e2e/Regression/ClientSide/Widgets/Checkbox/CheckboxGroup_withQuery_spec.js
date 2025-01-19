import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../../support/Pages/EditorNavigation";

const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Checkbox Group Widget Functionality",
  { tags: ["@tag.All", "@tag.Checkbox", "@tag.Binding"] },
  function () {
    let dsName;
    before(() => {
      _.dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
    });

    it("1. Check checkbox group with dynamic query", function () {
      let query1 = `SELECT * FROM public."country" LIMIT 10;`;
      let query2 = `SELECT * FROM public."country" LIMIT 2;`;

      // add Query 1 with limit 10
      _.dataSources.CreateQueryFromOverlay(dsName, query1); //Query1
      _.dataSources.RunQuery();

      // add Query 2 with limit 2
      _.dataSources.CreateQueryFromOverlay(dsName, query2); //Query2
      _.dataSources.RunQuery();

      // add checkbox group widget
      cy.dragAndDropToCanvas("checkboxgroupwidget", { x: 300, y: 300 });
      cy.openPropertyPane("checkboxgroupwidget");

      // bind options to query data
      cy.get(".t--property-control-options")
        .find(".t--js-toggle")
        .click({ force: true });
      cy.updateCodeInput(
        ".t--property-control-options",
        `{{Query1.data.map((item) => {
          return {
            label: "Option " + item.country_id,
            value: item.country_id,
          };
        })}}`,
      );

      // update default value
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        "{{Query2.data.map((item) => item.country_id)}}",
      );

      cy.wait(2000);

      // deploy the app
      _.deployMode.DeployApp();

      cy.wait(2000);

      // checked checkbox should be 2
      cy.get(publish.checkboxGroupWidget)
        .find("input:checked")
        .should("have.length", 2);
    });
  },
);

afterEach(() => {
  // put your clean up code if any
});
