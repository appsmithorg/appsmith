import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const queryLocators = require("../../../../../locators/QueryEditor.json");

let dsname;
describe("Chart Widget Skeleton Loading Functionality", function () {
  before(() => {
    _.agHelper.AddDsl("ChartLoadingDsl");
  });

  it(
    "excludeForAirgap",
    "1. Test case while reloading and on submission",
    function () {
      /**
       * Use case:
       * 1. Open Datasource editor
       * 2. Click on sample(mock) user database.
       * 3. Choose the first data source which consists of users keyword
       * 4. Click on the "New query +"" button
       * 5. Name the Query as "Query1"
       * 6. Write the query as "SELECT * FROM users ORDER BY id LIMIT 10;"
       * 7. Run the Query
       * 8. Go to Widgets
       * 9. Click on the Submit Button
       * 10. Check if we get "bp3-skeleton" class
       * 11. Reload the page
       * 12. Do step 10.
       * 13. Remove the datasource*
       */

      //Step1
      cy.wait(2000);
      _.dataSources.CreateMockDB("Users").then(() => {
        _.dataSources.CreateQueryAfterDSSaved();
        _.dataSources.ToggleUsePreparedStatement(false);
      });

      // Step6.2: writing query to get the schema
      _.dataSources.EnterQuery("SELECT * FROM users ORDER BY id LIMIT 10;");
      cy.WaitAutoSave();

      //Step7:
      cy.runQuery();

      //Step8:
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      cy.wait(1000);

      //Step9:
      cy.get(".bp3-button-text").first().click({ force: true });

      //Step10:
      cy.get(".t--widget-chartwidget div[class*='bp3-skeleton']").should(
        "exist",
      );

      /* This section is flaky hence commenting out
    //Step11:
    cy.reload();

    //Step12:
    cy.wait(1000);
    cy.get(".t--widget-chartwidget div[class*='bp3-skeleton']").should("exist");

    //Step13:
    /*cy.openPropertyPane("chartwidget");
    cy.updateCodeInput(".t--property-control-chart-series-data-control", "");
    cy.openPropertyPane("buttonwidget");
    cy.get(".t--property-control-onclick .t--js-toggle").click({ force: true });
    cy.updateCodeInput(".t--property-control-onclick", "");

    cy.get('.t--entity-name:contains("Query1")').click({ force: true });
    cy.get(".t--more-action-menu")
      .first()
      .click({ force: true });
    cy.get(".t--apiFormDeleteBtn")
      .first()
      .click({ force: true });

    cy.get('.t--entity-name:contains("Users")')
      .first()
      .click({ force: true });
    cy.get(".datasources .t--entity-add-btn")
      .last()
      .click();
    cy.get(pages.integrationActiveTab).click({ force: true });
    cy.get("span[name*='comment-context-menu']")
      .last()
      .click({ force: true });
    cy.wait(150);
    cy.get(".t--datasource-option-delete").click({ force: true }); */
    },
  );
  it(
    "airgap",
    "1. Test case while reloading and on submission - airgap",
    function () {
      cy.wait(2000);
      _.dataSources.CreateDataSource("Postgres");
      cy.get("@saveDatasource").then((httpResponse) => {
        dsname = httpResponse.response.body.data.name;
        _.dataSources.CreateQueryForDS(dsname);
      });
      cy.wait(1000);

      cy.get(".t--action-name-edit-field").click({ force: true });

      cy.get(queryLocators.queryNameField).type("Query1");

      cy.get(queryLocators.switch).last().click({ force: true });

      _.dataSources.EnterQuery("SELECT * FROM users ORDER BY id LIMIT 10;");

      cy.WaitAutoSave();

      cy.runQuery();

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);

      cy.wait(1000);

      cy.get(".bp3-button-text").first().click({ force: true });

      cy.get(".t--widget-chartwidget div[class*='bp3-skeleton']").should(
        "exist",
      );
    },
  );
});
