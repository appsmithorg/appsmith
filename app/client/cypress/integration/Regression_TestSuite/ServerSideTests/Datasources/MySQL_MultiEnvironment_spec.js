const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const datasourceFormData = require("../../../../fixtures/datasources.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");
const explorer = require("../../../../locators/explorerlocators.json");
const multienv = require("../../../../locators/MultiEnvlocator.json");

let dataSource = ObjectsRegistry.DataSources;
let datasourceName;
const query1 = "get_users";

describe("MySQL datasource test cases for MultiEnvironment", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1.Create and Validate MySQL Datasource with AutoSave validation and other negative scenarios", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    /*
    cy.reload();
    cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MySQL).click();

    // Validating save option before toggling env
    cy.xpath(multienv.hostAddress)
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath(multienv.portNumber)
      .clear()
      .type(datasourceFormData["mysql-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".t--datasource-modal-do-not-save").click();
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MySQL).click();
    cy.xpath(multienv.hostAddress)
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath(multienv.portNumber)
      .clear()
      .type(datasourceFormData["mysql-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".bp3-dialog").should("be.visible");
    cy.get(".t--datasource-modal-save").click();
    cy.xpath("//div[text()='Datasource Saved']").should("be.visible");
    cy.get(multienv.editDatasource).click();
    cy.toggleBetweenEnvironment("Production");
    */
    cy.xpath(multienv.hostAddress)
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath(multienv.portNumber)
      .clear()
      .type(datasourceFormData["mysql-port"]);

    cy.get(multienv.connectionMode).click();
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
      datasourceFormData["mysql-username"],
    );
    cy.xpath(multienv.password).type(
      datasourceFormData["mysql-password"],
    );
    /*
    cy.xpath("//div[text()='MySQL Specific Parameters']").scrollIntoView()
    .click({ force: true });
    cy.xpath("//p[text()='Server Timezone Override']").scrollIntoView().should("be.visible");
    */
    cy.xpath(multienv.sslText).click();
    cy.get(multienv.sslMode).click();
    cy.get(multienv.dropDownOption)
      .should("contain.text", "Default")
      .and("contain.text", "Required")
      .and("contain.text", "Disabled");
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
    cy.wait(2000);
    cy.get(multienv.editDatasource).click({ force: true });
  });

  it("2.Update DS details and create Production/Staging Env variables", function() {
    //Production Environment
    cy.wait(5000);
    cy.get(multienv.editDatasource).click({ force: true });
    cy.fillMySQLDatasourceEnvironmentDetails();
    cy.get(multienv.editDatasource).click({ force: true });
    cy.wait(5000);
    //Staging Environment
    cy.get(multienv.productionText)
      .first()
      .click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get(multienv.expandMore)
      .first()
      .click({ force: true });
    cy.get(multienv.stagingOption).click({ force: true });
    cy.get(multienv.selectNewField).click({ force: true });
    cy.fillMySQLDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(multienv.saveDatasource).should("not.be.enabled");
    cy.contains(datasourceFormData["mysql-host"]);
    cy.contains(datasourceFormData["mysql-port"]);
    cy.contains(datasourceFormData["mysql-username"]);
    cy.get(multienv.databaseName).should("not.be.enabled");
    cy.wait(3000);
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
    cy.wait(20000);
    cy.xpath(multienv.productionEnvText);
    cy.get(multienv.closeEditor).click({ force: true });
    cy.wait(5000);
  });

  it("3. Create a new query from the datasource editor", function() {
    // cy.get(datasource.createQuery).click();
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
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users ORDER BY id LIMIT 10;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });
});