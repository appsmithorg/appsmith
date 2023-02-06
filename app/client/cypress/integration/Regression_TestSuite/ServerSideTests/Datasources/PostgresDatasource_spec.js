const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const datasourceFormData = require("../../../../fixtures/datasources.json");

let dataSource = ObjectsRegistry.DataSources;
let datasourceName;

describe("Postgres datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.reload();
    cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
    });
    //Production Environment
    cy.get(".t--edit-datasource").click({ force: true });
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    //bindProductionEnvironmentVariable
    cy.fillPostgresDatasourceEnvironmentDetails();
    //Staging Environment
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    cy.get(".cs-text:contains('production')")
      .first()
      .click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get('span[name="expand-more"]')
      .first()
      .click({ force: true });
    cy.get("[data-cy='t--dropdown-option-staging']").click({ force: true });
    cy.get(".cs-text:contains('Please select an option')").click({
      force: true,
    });
    /*
    cy.get("[data-cy='t--dropdown-option-Username']").click({force:true});
    cy.get("[data-cy='t--dropdown-option-Password']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true})
    cy.get("[data-cy='t--dropdown-option-Database Name']").click({force:true});
    */
    cy.fillPostgresDatasourceEnvironmentDetailsStaging();
    cy.get(
      "[data-cy='t--dropdown-datasourceConfiguration.connection.mode'] .remixicon-icon",
    ).click({ force: true });
    cy.wait(3000);
    cy.get(".t--save-datasource").should("not.be.enabled");
    cy.contains(datasourceFormData["postgres-host"]);
    cy.contains(datasourceFormData["postgres-port"]);
    cy.contains(datasourceFormData["postgres-username"]);
    //cy.contains(datasourceFormData["postgres-password"]);
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.databaseName']",
    ).should("not.be.enabled");
    cy.get("[data-cy='t--dropdown-option-Read Only']").click({ force: true });
    cy.get(".t--save-datasource")
      .should("be.enabled")
      .click({ force: true });
    cy.wait("@updateDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(".t--toast-action .cs-text").should("not.be.visible");
    //cy.get("[data-cy='t--dropdown-option-Read Only']")
    //cy.get("[data-cy='t--dropdown-option-Read / Write']")
    //ToggleBetweenEnv()
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
    cy.wait(10000);
    /*
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
      dataSource.DeleteDatasouceFromActiveTab(
        datasourceName.replace(/['"]+/g, ""),
      );
    });*/
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
