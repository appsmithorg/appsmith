/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import { AppSidebar, AppSidebarButton } from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import { ObjectsRegistry } from "../support/Objects/Registry";
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const apiWidgetslocator = require("../locators/apiWidgetslocator.json");
const apiEditorLocators = require("../locators/ApiEditor");
const dataSources = ObjectsRegistry.DataSources;

const backgroundColorBlack = "rgb(76, 86, 100)";
const backgroundColorGray1 = "rgb(241, 245, 249)";
const backgroundColorGray2 = "rgba(0, 0, 0, 0)";
const backgroundColorGray8 = "rgb(106, 117, 133)";

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

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
        201,
      );
      // select datasource to be deleted by datasource title
      cy.get(".t--edit-datasource").click({ force: true });

      // delete datasource
      dataSources.DeleteDSDirectly(200);
    });
});

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  dataSources.NavigateToDSCreateNew();
});

Cypress.Commands.add("NavigateToActiveDatasources", () => {
  AppSidebar.navigate(AppSidebarButton.Data);
});

Cypress.Commands.add("testDatasource", (expectedRes = true) => {
  cy.get(".t--test-datasource").click({ force: true });
  cy.wait("@testDatasource")
    .its("response.body.data.success")
    .should("eq", expectedRes);
});

Cypress.Commands.add("saveDatasource", () => {
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@saveDatasource")
    .its("response.body.responseMeta.status")
    .should("eq", 201);
});

Cypress.Commands.add("testSaveDatasource", (expectedRes = true) => {
  cy.testDatasource(expectedRes);
  cy.saveDatasource();
  // cy.get(datasourceEditor.datasourceCard)
  //   .last()
  //   .click();
});

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
    cy.get(datasourceEditor.databaseName).clear().type(databaseName);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
  },
);

Cypress.Commands.add(
  "fillElasticDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    // we are using postgresql data for elastic search,
    // in the future, this should be changed, just for testing purposes
    const hostAddress = "https://localhost";
    const headerValue = "Bearer token";

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
    cy.get(datasourceEditor.headers).type(headerValue);
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
    cy.get(datasourceEditor.databaseName).clear().type(databaseName);
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
    cy.get(datasourceEditor.databaseName).clear().type(databaseName);
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
    cy.get(datasourceEditor.databaseName).clear().type(databaseName);

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
    cy.get(datasourceEditor.databaseName).clear().type(databaseName);
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

    cy.get(datasourceEditor["host"]).clear().type(userMockHostAddress);

    cy.get(datasourceEditor["databaseName"]).clear().type(userMockDatabaseName);

    cy.get(datasourceEditor["sectionAuthentication"]).click();

    cy.get(datasourceEditor["password"])
      .clear()
      .type(datasourceFormData["mockDatabasePassword"]);

    cy.get(datasourceEditor["username"]).clear().type(userMockDatabaseUsername);
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
  dataSources.NavigateToDSCreateNew();
  cy.get(datasourceEditor.PostgreSQL).click({ force: true });
  cy.fillPostgresDatasourceForm();
  cy.testSaveDatasource();
});

// this can be modified further when google sheets automation is done.
Cypress.Commands.add("createGoogleSheetsDatasource", () => {
  dataSources.NavigateToDSCreateNew();
  cy.get(datasourceEditor.GoogleSheets).click();
});

Cypress.Commands.add("deleteDatasource", (datasourceName) => {
  dataSources.DeleteDatasourceFromWithinDS(datasourceName);
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
  cy.get(datasourceEditor.projectID).clear().type(Cypress.env("S3_ACCESS_KEY"));
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

Cypress.Commands.add("ReconnectDatasource", (datasource) => {
  cy.xpath(`//span[text()='${datasource}']`).click();
});

Cypress.Commands.add("createNewAuthApiDatasource", (renameVal) => {
  cy.NavigateToAPI_Panel();
  //Click on Authenticated API
  cy.get(apiWidgetslocator.createAuthApiDatasource).click();
  //Verify weather Authenticated API is successfully created.
  // cy.wait("@saveDatasource").should(
  //   "have.nested.property",
  //   "response.body.responseMeta.status",
  //   201,
  // );
  cy.get(datasourceEditor.datasourceTitleLocator).click();
  cy.get(`${datasourceEditor.datasourceTitleLocator} input`)
    .clear()
    .type(renameVal, { force: true })
    .blur();
  //Fill dummy inputs and save
  cy.fillAuthenticatedAPIForm();
  cy.saveDatasource();
  // Added because api name edit takes some time to
  // reflect in api sidebar after the call passes.
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("deleteAuthApiDatasource", (renameVal) => {
  //Navigate to active datasources panel.
  dataSources.DeleteDatasourceFromWithinDS(renameVal);
});

Cypress.Commands.add("createGraphqlDatasource", (datasourceName) => {
  cy.NavigateToDatasourceEditor();
  //Click on Authenticated Graphql API
  cy.get(apiEditorLocators.createGraphQLDatasource).click({ force: true });
  //Verify weather Authenticated Graphql Datasource is successfully created.
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );

  // Change the Graphql Datasource name
  cy.get(".t--edit-datasource-name").click();
  cy.get(".t--edit-datasource-name input")
    .clear()
    .type(datasourceName, { force: true })
    .should("have.value", datasourceName)
    .blur();

  // Adding Graphql Url
  cy.get("input[name='url']").type(datasourceFormData.graphqlApiUrl);

  // save datasource
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("createMockDatasource", (datasourceName) => {
  cy.get(".t--mock-datasource").contains(datasourceName).click();
});

Cypress.Commands.add("datasourceCardContainerStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "min-width", "150px")
    .and(($el) => {
      const borderRadius = $el.css("border-radius");
      expect(borderRadius).to.match(/^(0px|4px)$/);
    })
    .and("have.css", "align-items", "center");
});

Cypress.Commands.add("datasourceCardStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "display", "flex")
    .and("have.css", "justify-content", "space-between")
    .and("have.css", "align-items", "center")
    .and("have.css", "height", "64px")
    .realHover()
    .should("have.css", "background-color", backgroundColorGray1)
    .and("have.css", "cursor", "pointer");
});

Cypress.Commands.add("datasourceImageStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "height", "34px")
    .and("have.css", "max-width", "100%");
});

Cypress.Commands.add("datasourceContentWrapperStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "display", "flex")
    .and("have.css", "align-items", "center")
    .and("have.css", "gap", "13px")
    .and("have.css", "padding-left", "13.5px");
});

Cypress.Commands.add("datasourceIconWrapperStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "background-color", backgroundColorGray2)
    .and("have.css", "height", "34px")
    .and("have.css", "border-radius", "0px")
    .and("have.css", "display", "block")
    .and("have.css", "align-items", "normal");
});

Cypress.Commands.add("datasourceNameStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "color", backgroundColorBlack)
    .and("have.css", "font-size", "16px")
    .and("have.css", "font-weight", "400")
    .and("have.css", "line-height", "24px")
    .and("have.css", "letter-spacing", "-0.24px");
});

Cypress.Commands.add("mockDatasourceDescriptionStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "color", backgroundColorGray8)
    .and("have.css", "font-size", "13px")
    .and("have.css", "font-weight", "400")
    .and("have.css", "line-height", "17px")
    .and("have.css", "letter-spacing", "-0.24px");
});
