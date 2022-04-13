/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const {
  addMatchImageSnapshotCommand,
} = require("cypress-image-snapshot/command");
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const explorer = require("../locators/explorerlocators.json");

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("firestoreDatasourceForm", () => {
  cy.get(datasourceEditor.datasourceConfigUrl).type(
    datasourceFormData["database-url"],
  );
  cy.get(datasourceEditor.projectID).type(datasourceFormData["projectID"]);
  cy.get(datasourceEditor.serviceAccCredential)
    .clear()
    .type(datasourceFormData["serviceAccCredentials"]);
});

Cypress.Commands.add("amazonDatasourceForm", () => {
  cy.get(datasourceEditor.projectID).type(datasourceFormData["access_key"]);
  cy.get(datasourceEditor.serviceAccCredential)
    .clear()
    .type(datasourceFormData["secret_key"]);
});

Cypress.Commands.add("testSaveDeleteDatasource", () => {
  // Instead of deleting the last datasource on the active datasources list,
  // we delete the datasource that was just created (identified by its title)
  cy.get(datasourceEditor.datasourceTitle)
    .invoke("text")
    .then((datasourceTitle) => {
      // test datasource
      cy.get(".t--test-datasource").click();
      cy.wait("@testDatasource");
      // .should("have.nested.property", "response.body.data.success", true)
      //  .debug();

      // save datasource
      cy.get(".t--save-datasource").click();
      cy.wait("@saveDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // select datasource to be deleted by datasource title
      cy.get(`${datasourceEditor.datasourceCard}`)
        .contains(datasourceTitle)
        .last()
        .click();
      // delete datasource
      cy.get(".t--delete-datasource").click();
      cy.get(".t--delete-datasource")
        .contains("Are you sure?")
        .click();
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });
});

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  cy.get(explorer.addDBQueryEntity)
    .last()
    .click({ force: true });
  cy.get(pages.integrationCreateNew)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("testDatasource", (expectedRes = true) => {
  cy.get(".t--test-datasource").click({ force: true });
  cy.wait("@testDatasource").should(
    "have.nested.property",
    "response.body.data.success",
    expectedRes,
  );
});

Cypress.Commands.add("saveDatasource", () => {
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@saveDatasource")
    .then((xhr) => {
      cy.log(JSON.stringify(xhr.response.body));
    })
    .should("have.nested.property", "response.body.responseMeta.status", 200);
});

Cypress.Commands.add("testSaveDatasource", (expectedRes = true) => {
  cy.testDatasource(expectedRes);
  cy.saveDatasource();
  // cy.get(datasourceEditor.datasourceCard)
  //   .last()
  //   .click();
});

Cypress.Commands.add(
  "fillMongoDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mongo-host"] + "  "
      : datasourceFormData["mongo-host"];
    // const databaseName = shouldAddTrailingSpaces
    //   ? datasourceFormData["mongo-databaseName"] + "  "
    //   : datasourceFormData["mongo-databaseName"];
    cy.get(datasourceEditor["host"]).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mongo-port"]);
    //cy.get(datasourceEditor["port"]).type(datasourceFormData["mongo-port"]);
    //cy.get(datasourceEditor["selConnectionType"]).click();
    //cy.contains(datasourceFormData["connection-type"]).click();
    //cy.get(datasourceEditor["defaultDatabaseName"]).type(databaseName);//is optional hence removing
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor["databaseName"])
      .clear()
      .type(datasourceFormData["mongo-databaseName"]);
    // cy.get(datasourceEditor["username"]).type(
    //   datasourceFormData["mongo-username"],
    // );
    // cy.get(datasourceEditor["password"]).type(
    //   datasourceFormData["mongo-password"],
    // );
    // cy.get(datasourceEditor["authenticationAuthtype"]).click();
    // cy.contains(datasourceFormData["mongo-authenticationAuthtype"]).click({
    //   force: true,
    // });
  },
);

Cypress.Commands.add(
  "fillPostgresDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-host"] + "  "
      : datasourceFormData["postgres-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-databaseName"] + "  "
      : datasourceFormData["postgres-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
  },
);

Cypress.Commands.add(
  "fillMySQLDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-host"] + "  "
      : datasourceFormData["mysql-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-databaseName"] + "  "
      : datasourceFormData["mysql-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mysql-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);

    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["mysql-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["mysql-password"],
    );
  },
);

Cypress.Commands.add(
  "fillMsSQLDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mssql-host"] + "  "
      : datasourceFormData["mssql-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mssql-databaseName"] + "  "
      : datasourceFormData["mssql-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mssql-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);

    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["mssql-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["mssql-password"],
    );
  },
);

Cypress.Commands.add(
  "fillArangoDBDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["arango-host"] + "  "
      : datasourceFormData["arango-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["arango-databaseName"] + "  "
      : datasourceFormData["arango-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["arango-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);

    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["arango-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["arango-password"],
    );
  },
);

Cypress.Commands.add(
  "fillRedshiftDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["redshift-host"] + "  "
      : datasourceFormData["redshift-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["redshift-databaseName"] + "  "
      : datasourceFormData["redshift-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["redshift-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);

    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["redshift-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["redshift-password"],
    );
  },
);

Cypress.Commands.add(
  "fillUsersMockDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const userMockDatabaseName = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockDatabaseName"] + "    "}`
      : datasourceFormData["mockDatabaseName"];

    const userMockHostAddress = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockHostAddress"] + "    "}`
      : datasourceFormData["mockHostAddress"];

    const userMockDatabaseUsername = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockDatabaseUsername"] + "    "}`
      : datasourceFormData["mockDatabaseUsername"];

    cy.get(datasourceEditor["host"])
      .clear()
      .type(userMockHostAddress);

    cy.get(datasourceEditor["databaseName"])
      .clear()
      .type(userMockDatabaseName);

    cy.get(datasourceEditor["sectionAuthentication"]).click();

    cy.get(datasourceEditor["password"])
      .clear()
      .type(datasourceFormData["mockDatabasePassword"]);

    cy.get(datasourceEditor["username"])
      .clear()
      .type(userMockDatabaseUsername);
  },
);
Cypress.Commands.add(
  "fillSMTPDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["smtp-host"] + "  "
      : datasourceFormData["smtp-host"];
    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["smtp-port"]);
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(datasourceFormData["smtp-username"]);
    cy.get(datasourceEditor.password).type(datasourceFormData["smtp-password"]);
  },
);

Cypress.Commands.add("createPostgresDatasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.PostgreSQL).click();
  //cy.getPluginFormsAndCreateDatasource();
  cy.fillPostgresDatasourceForm();
  cy.testSaveDatasource();
});

Cypress.Commands.add("deleteDatasource", (datasourceName) => {
  cy.NavigateToQueryEditor();
  cy.get(pages.integrationActiveTab)
    .should("be.visible")
    .click({ force: true });
  cy.contains(".t--datasource-name", datasourceName).click();
  cy.get(".t--delete-datasource").click();
  cy.get(".t--delete-datasource")
    .contains("Are you sure?")
    .click();
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("renameDatasource", (datasourceName) => {
  cy.get(".t--edit-datasource-name").click();
  cy.get(".t--edit-datasource-name input")
    .clear()
    .type(datasourceName, { force: true })
    .should("have.value", datasourceName)
    .blur();
});

Cypress.Commands.add("fillAmazonS3DatasourceForm", () => {
  cy.get(datasourceEditor.projectID)
    .clear()
    .type(Cypress.env("S3_ACCESS_KEY"));
  cy.get(datasourceEditor.serviceAccCredential)
    .clear()
    .type(Cypress.env("S3_SECRET_KEY"));
});

Cypress.Commands.add("createAmazonS3Datasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.AmazonS3).click();
  cy.fillAmazonS3DatasourceForm();
  cy.testSaveDatasource();
});

Cypress.Commands.add("fillMongoDatasourceFormWithURI", () => {
  cy.xpath(datasourceEditor["mongoUriDropdown"])
    .click()
    .wait(500);
  cy.xpath(datasourceEditor["mongoUriYes"])
    .click()
    .wait(500);
  cy.xpath(datasourceEditor["mongoUriInput"]).type(
    datasourceFormData["mongo-uri"],
  );
});

Cypress.Commands.add("ReconnectDatasource", (datasource) => {
  cy.xpath(`//span[text()='${datasource}']`).click();
});
