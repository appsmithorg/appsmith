const datasource = require("../../../../locators/DatasourcesEditor.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const datasourceFormData = require("../../../../fixtures/datasources.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");
const explorer = require("../../../../locators/explorerlocators.json");

let dataSource = ObjectsRegistry.DataSources;
let datasourceName;
const query1 = "get_users";

describe("MySQL datasource test cases for MultiEnvironment", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create and Validate MySQL Datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.reload();
    cy.get(".t--datasource-modal-do-not-save").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MySQL).click();

    // Validating save option before toggling env
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["mysql-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".t--datasource-modal-do-not-save").click();
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get("[data-cy='t--invalid-page-go-back']").click({ force: true });
    cy.get(datasource.MySQL).click();
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["mysql-port"]);
    cy.toggleBetweenEnvironment("Staging");
    cy.get(".bp3-dialog").should("be.visible");
    cy.get(".t--datasource-modal-save").click();
    cy.xpath("//div[text()='Datasource Saved']").should("be.visible");
    cy.get(".t--edit-datasource").click();
    cy.toggleBetweenEnvironment("Production");
    cy.xpath("//input[contains(@name,'host')]")
      .clear()
      .type(datasourceFormData["mysql-host"]);
    cy.xpath("//input[contains(@name,'port')]")
      .clear()
      .type(datasourceFormData["mysql-port"]);

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
      datasourceFormData["mysql-username"],
    );
    cy.xpath("//input[contains(@name,'password')]").type(
      datasourceFormData["mysql-password"],
    );
    cy.xpath("//div[text()='SSL (optional)']").click();
    cy.get(
      "[data-cy='t--dropdown-datasourceConfiguration.connection.ssl.authType']",
    ).click();
    cy.get(".t--dropdown-option")
      .should("contain.text", "Default")
      .and("contain.text", "Required")
      .and("contain.text", "Disabled");
    cy.get(".t--dropdown-option")
      .contains("Default")
      .click();
    cy.xpath("//div[text()='MySQL Specific Parameters']").click();
    cy.xpath("//p[text()='Server Timezone Override']").should("be.visible");
    cy.get(".t--delete-field")
      .last()
      .click();
    cy.saveDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = JSON.stringify(httpResponse.response.body.data.name);
    });
    cy.wait(2000);
    cy.get(".t--edit-datasource").click({ force: true });
  });

  it("Update DS details and create Production/Staging Env variables", function() {
    //Production Environment
    cy.wait(5000);
    cy.get(".t--edit-datasource").click({ force: true });
    cy.fillMySQLDatasourceEnvironmentDetails();
    cy.get(".t--edit-datasource").click({ force: true });
    cy.wait(5000);
    //Staging Environment
    cy.get(".cs-text:contains('Production')")
      .first()
      .click({ force: true });
    //bindStagingEnvironmentVariable
    cy.get('span[name="expand-more"]')
      .first()
      .click({ force: true });
    cy.get("[data-cy='t--dropdown-option-Staging']").click({ force: true });
    cy.get(".cs-text:contains('Select a new field')").click({ force: true });
    cy.fillMySQLDatasourceEnvironmentDetailsStaging();
    cy.wait(3000);
    cy.get(".t--save-datasource").should("not.be.enabled");
    cy.contains(datasourceFormData["mysql-host"]);
    cy.contains(datasourceFormData["mysql-port"]);
    cy.contains(datasourceFormData["mysql-username"]);
    cy.get(
      "[data-cy='datasourceConfiguration.authentication.databaseName']",
    ).should("not.be.enabled");
    cy.wait(3000);
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
    cy.wait(20000);
    cy.xpath("//span[(@type='p1') and contains(text(),'Production')]");
    cy.get(" .t--close-editor:contains('Back')").click({ force: true });
    cy.wait(5000);
  });

  it("3. Create a new query from the datasource editor", function() {
    // cy.get(datasource.createQuery).click();
    cy.get(datasource.datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(datasource.datasourceCard)
      .within(() => {
        cy.get(datasource.createQuery).click();
      });
    cy.wait("@createNewApi").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get(queryLocators.queryNameField).type(`${query1}`);
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
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
