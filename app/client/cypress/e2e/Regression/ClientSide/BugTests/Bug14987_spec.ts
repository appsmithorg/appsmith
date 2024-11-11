const queryLocators = require("../../../../locators/QueryEditor.json");
import {
  dataSources,
  agHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Verify setting tab form controls not to have tooltip and tooltip (underline) styles",
  {
    tags: [
      "@tag.Datasource",
      "@tag.Settings",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
    let guid, datasourceName;

    before("Creates a new Mongo datasource", () => {
      dataSources.CreateDataSource("Mongo");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
    });

    it("1. We make sure the label in the settings tab does not have any underline styles", function () {
      dataSources.CreateQueryForDS(datasourceName);

      cy.xpath(queryLocators.querySettingsTab).click();

      cy.get(".label-icon-wrapper")
        .contains("Run the query on page load")
        .parent()
        .then(($el) => {
          cy.window().then((win) => {
            cy.log($el, win);
            const after = win.getComputedStyle($el[0], "::after");
            cy.log($el, win, after);
            const afterBorderBottom = after.getPropertyValue("borderBottom");
            //   we expect the border bottom of the element to be an empty string as opposed to "1px dashed"
            expect(afterBorderBottom).to.equal("");
          });
        });

      cy.get(".label-icon-wrapper")
        .contains("Request confirmation before running this query")
        .parent()
        .then(($el) => {
          cy.window().then((win) => {
            cy.log($el, win);
            const after = win.getComputedStyle($el[0], "::after");
            cy.log($el, win, after);
            const afterBorderBottom = after.getPropertyValue("borderBottom");
            //   we expect the border bottom of the element to be an empty string as opposed to "1px dashed"
            expect(afterBorderBottom).to.equal("");
          });
        });

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, 200);
    });
  },
);
