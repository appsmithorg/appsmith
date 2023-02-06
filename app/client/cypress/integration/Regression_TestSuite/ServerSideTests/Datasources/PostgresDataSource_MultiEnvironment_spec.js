const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const datasourceFormData = require("../../../../fixtures/datasources.json");

let guid, datasourceName;

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

let dataSource = ObjectsRegistry.DataSources;
let datasourceName;

describe("Postgres datasource test cases for Multi-Environment ", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create and Validate Postgres Datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.reload();
    cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.PostgreSQL).click();
    // Validating save option before toggling env
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["postgres-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["postgres-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".t--datasource-modal-do-not-save").click();
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.PostgreSQL).click();
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["postgres-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["postgres-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".bp3-dialog").should("be.visible");
    cy.get(".t--datasource-modal-save").click();
    cy.xpath("//div[text()='Datasource Saved']").should("be.visible");
    cy.get(".t--edit-datasource").click();
    cy.toggleBetweenEnvironment("Production");
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["postgres-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["postgres-port"]);
    cy.get(
      "[data-cy='t--dropdown-datasourceConfiguration.connection.mode']",
    ).click();
    cy.get(".t--dropdown-option").should("contain.text", "Read Only");
    cy.get(".t--dropdown-option").should("contain.text", "Read / Write");
    cy.get(".t--dropdown-option")
      .contains("Read / Write")
      .click();
    cy.get(".t--add-field").click();
    cy.xpath("//input[contains(@name,'host')]")
      .last()
      .type("Test");
    cy.xpath("//input[contains(@name,'port')]")
      .last()
      .type("1234");
    cy.xpath("//input[contains(@name,'databaseName')]")
      .clear()
      .type("TestDB");
    cy.xpath("//div[text()='Authentication']").click();
    cy.xpath("//input[contains(@name,'username')]").type(
      datasourceFormData["postgres-username"],
    );
    cy.xpath("//input[contains(@name,'password')]").type(
      datasourceFormData["postgres-password"],
    );
    cy.xpath("//div[text()='SSL (optional)']").click();
    cy.get(
      "[data-cy='t--dropdown-datasourceConfiguration.connection.ssl.authType']",
    ).click();
    cy.get(".t--dropdown-option")
      .should("contain.text", "Default")
      .and("contain.text", "Allow")
      .and("contain.text", "Prefer")
      .and("contain.text", "Require")
      .and("contain.text", "Disable");
    cy.get(".t--dropdown-option")
      .contains("Default")
      .click();
    cy.get(".t--delete-field")
      .last()
      .click();
    cy.saveDatasource();
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    cy.get(".t--edit-datasource").click({ force: true });
  });

  it("Update DS details and create Production/Staging Env variables", function() {
    cy.wait(5000);
    cy.get(".t--edit-datasource").click({ force: true });
    //bindProductionEnvironmentVariable
    cy.fillPostgresDatasourceEnvironmentDetails();
    cy.wait(3000);
    cy.get(".t--save-datasource").should("not.be.enabled");
    cy.contains(datasourceFormData["postgres-host"]);
    cy.contains(datasourceFormData["postgres-port"]);
    cy.contains(datasourceFormData["postgres-username"]);
    //cy.contains(datasourceFormData["postgres-password"]);
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.databaseName']",
    ).should("not.be.enabled");
    //Staging Environment
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    cy.get(".cs-text:contains('Production')")
      .first()
      .click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get('span[name="expand-more"]')
      .first()
      .click({ force: true });
    cy.get("[data-cy='t--dropdown-option-Staging']").click({ force: true });
    cy.get(".cs-text:contains('Select a new field')").click({ force: true });
    cy.fillPostgresDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(".t--save-datasource").should("not.be.enabled");
    cy.contains(datasourceFormData["postgres-host"]);
    cy.contains(datasourceFormData["postgres-port"]);
    cy.contains(datasourceFormData["postgres-username"]);
    // cy.contains(datasourceFormData["postgres-password"]);
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.databaseName']",
    ).should("not.be.enabled");
    cy.get(".t--toast-action .cs-text").should("not.be.visible");
    //ToggleBetweenEnv()
    cy.wait(3000);
    cy.toggleBetweenEnvironment("Staging");
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@getWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(30000);
    cy.xpath("//span[(@type='p1') and contains(text(),'Staging')]");
    cy.toggleBetweenEnvironment("Production");
    cy.wait("@getPagesForCreateApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@getWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(30000);
    cy.xpath("//span[(@type='p1') and contains(text(),'Production')]");
  });
  /*
      it("2. Create with trailing white spaces in host address and database name, test, save then delete a postgres datasource", function() {
        cy.NavigateToDatasourceEditor();
        cy.get(datasource.PostgreSQL).click();
        cy.fillPostgresDatasourceForm(true);
        cy.testSaveDatasource();
        cy.get("@saveDatasource").then((httpResponse) => {
          datasourceName = JSON.stringify(
            httpResponse.response.body.data.name,
          ).replace(/['"]+/g, "");
        });
      });
    
      it("3. Create a new query from the datasource editor", function() {
        cy.get(datasource.createQuery)
          .last()
          .click();
        cy.wait("@createNewApi").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          201,
        );
        cy.deleteQueryUsingContext();
        cy.deleteDatasource(datasourceName);
      });
    */
});
