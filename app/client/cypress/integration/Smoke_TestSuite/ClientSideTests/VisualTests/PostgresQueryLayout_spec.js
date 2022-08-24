const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let queryName;

describe("Bug 13406: Postgres query response test case", function() {
  /**
   * Use case:
   * 1. Open Datasource editor
   * 2. Click on sample(mock) user database.
   * 3. Choose the first data source which consists of users keyword
   * 4. Click on the "New Query +"" button
   * 5. Name the Query as "Query1"
   * 6. Write the query as "SELECT * FROM users ORDER BY id LIMIT 10;"
   * 7. Run the Query
   * 8. Take screenshot of table response and compare it with reference screenshot
   */

  beforeEach(() => {
    cy.startRoutesForDatasource();
    // step 1
    cy.NavigateToDatasourceEditor();
    //Step2
    cy.get(datasource.mockUserDatabase).click();
  });

  it("1. Create mock user datasource & compare table response when scroll bar is present", function() {
    //Step3 & 4
    cy.get(`${datasource.datasourceCard}`)
      .contains("Users")
      .get(`${datasource.createQuery}`)
      .last()
      .click({ force: true });

    //Step5.1: Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    cy.generateUUID().then((uid) => {
      queryName = uid;
      //Step5.2: Click the editing field
      cy.get(queryEditor.queryNameField).type(queryName);

      // switching off Use Prepared Statement toggle
      cy.get(queryEditor.switch)
        .last()
        .click({ force: true });

      //Step 6.1: Click on Write query area
      cy.get(queryEditor.templateMenu).click();
      cy.get(queryEditor.query).click({ force: true });

      // Step6.2: writing query to get the schema
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("SELECT id, gender FROM users ORDER BY id LIMIT 10;", {
          force: true,
          parseSpecialCharSequences: false,
        });
      cy.WaitAutoSave();

      //Step7:
      cy.runQuery();

      //Step8:
      cy.get(datasource.postgresResponseTableView).matchImageSnapshot(
        "postgresquerytableresponsescroll",
      );
    });
  });

  it("2. Create mock user datasource & compare table response when scroll bar is not present", function() {
    //Step3 & 4
    cy.get(`${datasource.datasourceCard}`)
      .contains("Users")
      .get(`${datasource.createQuery}`)
      .last()
      .click({ force: true });

    //Step5.1: Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    cy.generateUUID().then((uid) => {
      queryName = uid;
      //Step5.2: Click the editing field
      cy.get(queryEditor.queryNameField).type(queryName);

      // switching off Use Prepared Statement toggle
      cy.get(queryEditor.switch)
        .last()
        .click({ force: true });

      //Step 6.1: Click on Write query area
      cy.get(queryEditor.templateMenu).click();
      cy.get(queryEditor.query).click({ force: true });

      // Step6.2: writing query to get the schema
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("SELECT id, gender FROM users ORDER BY id LIMIT 2;", {
          force: true,
          parseSpecialCharSequences: false,
        });
      cy.WaitAutoSave();

      //Step7:
      cy.runQuery();

      //Step8:
      cy.get(datasource.postgresResponseTableView).matchImageSnapshot(
        "postgresquerytableresponsenoscroll",
      );
    });
  });
});
