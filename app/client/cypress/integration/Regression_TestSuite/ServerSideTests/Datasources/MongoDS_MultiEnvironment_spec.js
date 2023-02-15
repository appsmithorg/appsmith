const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");

describe("Create, test, save then delete a mongo datasource with multiple environment", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1.Create and Validate MySQL Datasource with AutoSave validation and other negative scenarios", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    /*
    cy.reload();
    cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MongoDB).click();

    // Validating save option before toggling env
    cy.xpath("//input[contains(@name,'host')]").clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").clear()
        .type(datasourceFormData["mongo-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".t--datasource-modal-do-not-save").click();
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MongoDB).click();
    cy.xpath("//input[contains(@name,'host')]").clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").clear()
        .type(datasourceFormData["mongo-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".bp3-dialog").should("be.visible");
    cy.get(".t--datasource-modal-save").click();
    cy.xpath("//div[text()='Datasource Saved']").should("be.visible");
    cy.get(".t--edit-datasource").click();
    cy.toggleBetweenEnvironment("Production");
    */
    cy.xpath("//input[contains(@name,'host')]").clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").clear()
        .type(datasourceFormData["mongo-port"]);

    cy.get("[data-cy='t--dropdown-datasourceConfiguration.connection.mode']").click();
    cy.get(".t--dropdown-option").should("contain.text", "Read Only");
    cy.get(".t--dropdown-option").should("contain.text", "Read / Write");
    cy.get(".t--dropdown-option").contains("Read / Write").click();
    cy.get("[data-cy='t--dropdown-datasourceConfiguration.connection.type']").click();
    cy.get(".t--dropdown-option").should("contain.text", "Direct Connection")
        .and("contain.text", "Replica set");
    cy.get(".t--dropdown-option").contains("Direct Connection").click();
    cy.xpath("//input[contains(@name,'host')]").clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").clear()
        .type(datasourceFormData["mongo-port"]);
    cy.get(".t--add-field").click();
    cy.xpath("//input[contains(@name,'host')]").last().type("Test");
    cy.xpath("//input[contains(@name,'port')]").last().type("1234");
    cy.xpath("//div[text()='Authentication']").click();
    cy.xpath("//input[contains(@name,'databaseName')]").clear().type("TestDB");
    cy.xpath("//input[contains(@name,'username')]")
        .type(datasourceFormData["mongo-username"]);
    cy.xpath("//input[contains(@name,'password')]")
        .type(datasourceFormData["mongo-password"]);
    cy.get("[data-cy='t--dropdown-datasourceConfiguration.authentication.authType']").click();
    cy.get(".t--dropdown-option").should("contain.text", "SCRAM-SHA-1")
        .and("contain.text", "SCRAM-SHA-256")
        .and("contain.text", "MONGODB-CR");
    cy.get(".t--dropdown-option").contains("SCRAM-SHA-1").click();
    cy.xpath("//div[text()='SSL (optional)']").click();
    cy.get("[data-cy='t--dropdown-datasourceConfiguration.connection.ssl.authType']")
        .click();
    cy.get(".t--dropdown-option").should("contain.text", "Default")
        .and("contain.text", "Enabled")
        .and("contain.text", "Disabled");
    cy.get(".t--dropdown-option").contains("Default").click();
    cy.get(".t--delete-field").last().click();
    cy.saveDatasource();
    cy.wait(2000);
    cy.get(".t--edit-datasource").click({force: true});
  })

  it("2.Update DS details and create Production/Staging Env variables", function() {
    cy.fillMongoDatasourceForm();
    // cy.testSaveDeleteDatasource();
    cy.get(".t--save-datasource").click();
    cy.wait(2000);
    //Production Environment
    cy.get(".t--edit-datasource").click({ force: true });
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    cy.fillMongoDBDatasourceEnvironmentDetails();
    cy.get("[data-cy='datasourceConfiguration.authentication.databaseName']")
      .should("not.be.enabled");
    cy.get("[data-cy='datasourceConfiguration.authentication.username']")
      .should("not.be.enabled");
    cy.get("[data-cy='datasourceConfiguration.authentication.password']")
      .should("not.be.enabled"); 
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    //Staging Environment
    cy.get(".cs-text:contains('Production')").first().click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get('span[name="expand-more"]').first().click({ force: true });
    cy.get("[data-cy='t--dropdown-option-Staging']").click({ force: true });
    cy.get(".cs-text:contains('Select a new field')").click({ force: true });
    cy.fillMongoDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(".t--save-datasource").should("not.be.enabled");
    cy.contains(datasourceFormData["mongo-host"]);
    cy.contains(datasourceFormData["mongo-port"]);
    cy.contains(datasourceFormData["mongo-username"]);
    cy.get("[data-cy='datasourceConfiguration.authentication.databaseName']")
      .should("not.be.enabled");
    cy.get("[data-cy='datasourceConfiguration.authentication.username']")
      .should("not.be.enabled");
    cy.get("[data-cy='datasourceConfiguration.authentication.password']")
      .should("not.be.enabled");    
  });
})