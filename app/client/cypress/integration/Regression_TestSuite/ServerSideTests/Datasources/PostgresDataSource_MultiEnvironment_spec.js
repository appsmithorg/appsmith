const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const datasourceFormData = require("../../../../fixtures/datasources.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const multienv = require("../../../../locators/MultiEnvlocator.json");

let guid, datasourceName;

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

let dataSource = ObjectsRegistry.DataSources;
//let datasourceName;

describe("Postgres datasource test cases for Multi-Environment ", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1.Create and Validate Postgres Datasource with AutoSave validation and other negative scenarios", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    //cy.reload();
    //cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    //cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    //cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    //cy.get(datasource.PostgreSQL).click();
    // Validating save option before toggling env
    cy.xpath(multienv.hostAddress)
      .clear()
      .type(datasourceFormData["postgres-host"]);
    cy.xpath(multienv.portNumber)
      .clear()
      .type(datasourceFormData["postgres-port"]);
    /*  
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
    */
    cy.xpath(multienv.hostAddress)
      .clear()
      .type(datasourceFormData["postgres-host"]);
    cy.xpath(multienv.portNumber)
      .clear()
      .type(datasourceFormData["postgres-port"]);
    cy.get(
      multienv.connectionMode,
    ).click();
    cy.get(multienv.dropDownOption).should("contain.text", "Read Only");
    cy.get(multienv.dropDownOption).should("contain.text", "Read / Write");
    cy.get(multienv.dropDownOption)
      .contains("Read / Write")
      .click();
    cy.get(multienv.addField).click();
    cy.xpath(multienv.hostAddress)
      .last()
      .type("Test");
    cy.xpath(multienv.portNumber)
      .last()
      .type("1234");
    cy.get(multienv.databaseName)
      .clear()
      .type("TestDB");
    cy.xpath(multienv.authenticationText).click();
    cy.xpath(multienv.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.xpath(multienv.password).type(
      datasourceFormData["postgres-password"],
    );
    cy.xpath(multienv.sslText).click();
    cy.get(
      multienv.sslMode,
    ).click();
    cy.get(multienv.dropDownOption)
      .should("contain.text", "Default")
      .and("contain.text", "Allow")
      .and("contain.text", "Prefer")
      .and("contain.text", "Require")
      .and("contain.text", "Disable");
    cy.get(multienv.dropDownOption)
      .contains("Default")
      .click();
    cy.get(multienv.deleteField)
      .last()
      .click();
    cy.saveDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
    });
    cy.get(multienv.editDatasource).click({ force: true });
  });

  it("2.Update DS details and create Production/Staging Env variables", function() {
    cy.wait(5000);
    cy.get(multienv.editDatasource).click({ force: true });
    //bindProductionEnvironmentVariable
    cy.fillPostgresDatasourceEnvironmentDetails();
    cy.wait(3000);
    cy.get(multienv.saveDatasource).should("not.be.enabled");
    cy.contains(datasourceFormData["postgres-host"]);
    cy.contains(datasourceFormData["postgres-port"]);
    cy.contains(datasourceFormData["postgres-username"]);
    //cy.contains(datasourceFormData["postgres-password"]);
    cy.get(
      multienv.databaseName,
    ).should("not.be.enabled");
    //Staging Environment
    cy.get(multienv.editDatasource).click({ force: true });
    cy.wait(5000);
    cy.get(multienv.productionText)
      .first()
      .click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get(multienv.expandMore)
      .first()
      .click({ force: true });
    cy.get(multienv.stagingOption).click({ force: true });
    cy.get(multienv.selectNewField).click({ force: true });
    cy.fillPostgresDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(multienv.saveDatasource).should("not.be.enabled");
    cy.contains(datasourceFormData["postgres-host"]);
    cy.contains(datasourceFormData["postgres-port"]);
    cy.contains(datasourceFormData["postgres-username"]);
    // cy.contains(datasourceFormData["postgres-password"]);
    cy.get(
      multienv.databaseName,
    ).should("not.be.enabled");
    cy.get(multienv.toast).should("not.be.visible");
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
    cy.wait(3000);
    cy.xpath(multienv.stagingEnvText);
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
    cy.wait(3000);
    cy.xpath(multienv.productionEnvText);
  });

  it.skip("3. Create a new query from the datasource editor", function() {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.get(datasource.createQuery)
          .last()
          .click();
    cy.wait("@createNewApi").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          201,
        );
    cy.get(queryLocators.templateMenu).click({ force: true });
    cy.typeValueNValidate("select * from users limit 10");
    cy.runAndDeleteQuery();
  });
});