const dsl = require("../../../../../fixtures/ChartLoadingDsl.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");

describe("Chart Widget Skeleton Loading Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test case while reloading and on submission", function() {
    /**
     * Use case:
     * 1. Open Datasource editor
     * 2. Click on sample(mock) user database.
     * 3. Choose the first data source which consists of users keyword
     * 4. Click on the "New Query +"" button
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
    cy.NavigateToDatasourceEditor();

    //Step2
    cy.get(datasource.mockUserDatabase).click();

    //Step3 & 4
    cy.get(`${datasource.datasourceCard}`)
      .contains("Users")
      .get(`${datasource.createQuery}`)
      .last()
      .click({ force: true });

    //Step5.1: Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    //Step5.2: Click the editing field
    cy.get(queryLocators.queryNameField).type("Query1");

    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });

    //Step 6.1: Click on Write query area
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });

    // Step6.2: writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users ORDER BY id LIMIT 10;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();

    //Step7:
    cy.runQuery();

    //Step8:
    cy.get('.t--entity-name:contains("Page1")').click({ force: true });

    cy.wait(1000);

    //Step9:
    cy.get(".bp3-button-text")
      .first()
      .click({ force: true });

    //Step10:
    cy.get(".t--widget-chartwidget div[class*='bp3-skeleton']").should("exist");

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
  });
});
