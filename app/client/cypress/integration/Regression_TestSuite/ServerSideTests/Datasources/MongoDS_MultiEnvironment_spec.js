const datasource = require("../../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../../fixtures/datasources.json");
const multienv = require("../../../../locators/MultiEnvlocator.json");

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
    cy.get(multienv.editDatasource).click();
    cy.toggleBetweenEnvironment("Production");
    */
    cy.xpath(multienv.hostAddress).clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath(multienv.portNumber).clear()
        .type(datasourceFormData["mongo-port"]);

    cy.get(multienv.connectionMode).click();
    cy.get(multienv.dropDownOption).should("contain.text", "Read Only");
    cy.get(multienv.dropDownOption).should("contain.text", "Read / Write");
    cy.get(multienv.dropDownOption).contains("Read / Write").click();
    cy.get(multienv.connectionType).click();
    cy.get(multienv.dropDownOption).should("contain.text", "Direct Connection")
        .and("contain.text", "Replica set");
    cy.get(multienv.dropDownOption).contains("Direct Connection").click();
    cy.xpath(multienv.hostAddress).clear()
        .type(datasourceFormData["mongo-host"]);
    cy.xpath(multienv.portNumber).clear()
        .type(datasourceFormData["mongo-port"]);
    cy.get(multienv.addField).click();
    cy.xpath(multienv.hostAddress).last().type("Test");
    cy.xpath(multienv.portNumber).last().type("1234");
    cy.xpath(multienv.authenticationText).click();
    cy.wait(2000);
    //cy.get(multienv.databaseName).clear().type("TestDB");
    cy.xpath(multienv.username)
        .type(datasourceFormData["mongo-username"]);
    cy.xpath(multienv.password)
        .type(datasourceFormData["mongo-password"]);
    cy.get(multienv.authenticationType).click();
    cy.get(multienv.dropDownOption).should("contain.text", "SCRAM-SHA-1")
        .and("contain.text", "SCRAM-SHA-256")
        .and("contain.text", "MONGODB-CR");
    cy.get(multienv.dropDownOption).contains("SCRAM-SHA-1").click();
    cy.xpath(multienv.sslText).click();
    cy.get(multienv.sslMode)
        .click();
    cy.get(multienv.dropDownOption).should("contain.text", "Default")
        .and("contain.text", "Enabled")
        .and("contain.text", "Disabled");
    cy.get(multienv.dropDownOption).contains("Default").click();
    cy.get(multienv.deleteField).last().click();
    cy.saveDatasource();
    cy.wait(2000);
    cy.get(multienv.editDatasource).click({force: true});
  })

  it("2.Update DS details and create Production/Staging Env variables", function() {
    cy.fillMongoDatasourceForm();
    // cy.testSaveDeleteDatasource();
    cy.get(multienv.saveDatasource).click();
    cy.wait(2000);
    //Production Environment
    cy.get(multienv.editDatasource).click({ force: true });
    cy.get(multienv.editDatasource).click({ force: true });
    cy.wait(5000);
    cy.fillMongoDBDatasourceEnvironmentDetails();
    cy.get(multienv.databaseName)
      .should("not.be.enabled");
    cy.xpath(multienv.username)
      .should("not.be.enabled");
    cy.xpath(multienv.password)
      .should("not.be.enabled"); 
    cy.get(multienv.editDatasource).click({ force: true });
    cy.wait(5000);
    //Staging Environment
    cy.get(multienv.productionText).first().click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get(multienv.expandMore).first().click({ force: true });
    cy.get(multienv.stagingOption).click({ force: true });
    cy.get(multienv.selectNewField).click({ force: true });
    cy.fillMongoDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(multienv.saveDatasource).should("not.be.enabled");
    cy.contains(datasourceFormData["mongo-host"]);
    cy.contains(datasourceFormData["mongo-port"]);
    cy.contains(datasourceFormData["mongo-username"]);
    cy.get(multienv.databaseName)
      .should("not.be.enabled");
    cy.get(multienv.databaseName)
      .should("not.be.enabled");
    cy.xpath(multienv.password)
      .should("not.be.enabled");    
  });
})