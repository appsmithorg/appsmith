/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import { AppSidebar, AppSidebarButton } from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import { ObjectsRegistry } from "../support/Objects/Registry";
import { agHelper } from "./Objects/ObjectsCore";
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

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  dataSources.NavigateToDSCreateNew();
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["postgres-port"],
    );
    agHelper.ClearNType(datasourceEditor.databaseName, databaseName);
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["postgres-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["postgres-port"],
    );
    cy.get(datasourceEditor.sectionAuthentication).click();
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["postgres-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
      datasourceFormData["postgres-password"],
    );
    agHelper.ClearNType(datasourceEditor.headers, headerValue);
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["mysql-port"],
    );
    agHelper.ClearNType(datasourceEditor.databaseName, databaseName);
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["mysql-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["mssql-port"],
    );
    agHelper.ClearNType(datasourceEditor.databaseName, databaseName);
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["mssql-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["arango-port"],
    );
    agHelper.ClearNType(datasourceEditor.databaseName, databaseName);
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["arango-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
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

    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(
      datasourceEditor.port,
      datasourceFormData["redshift-port"],
    );
    agHelper.ClearNType(datasourceEditor.databaseName, databaseName);
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["redshift-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
      datasourceFormData["redshift-password"],
    );
  },
);

Cypress.Commands.add(
  "fillSMTPDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["smtp-host"] + "  "
      : datasourceFormData["smtp-host"];
    agHelper.ClearNType(datasourceEditor.host, hostAddress);
    agHelper.ClearNType(datasourceEditor.port, datasourceFormData["smtp-port"]);
    cy.get(datasourceEditor.sectionAuthentication).click();
    agHelper.ClearNType(
      datasourceEditor.username,
      datasourceFormData["smtp-username"],
    );
    agHelper.ClearNType(
      datasourceEditor.password,
      datasourceFormData["smtp-password"],
    );
  },
);

Cypress.Commands.add("createPostgresDatasource", () => {
  dataSources.NavigateToDSCreateNew();
  agHelper.GetNClick(datasourceEditor.PostgreSQL);
  cy.fillPostgresDatasourceForm();
  cy.testSaveDatasource();
});

// this can be modified further when google sheets automation is done.
Cypress.Commands.add("createGoogleSheetsDatasource", () => {
  dataSources.NavigateToDSCreateNew();
  agHelper.GetNClick(datasourceEditor.GoogleSheets);
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
  agHelper.ClearNType(datasourceEditor.projectID, Cypress.env("S3_ACCESS_KEY"));
  agHelper.ClearNType(
    datasourceEditor.serviceAccCredential,
    Cypress.env("S3_SECRET_KEY"),
  );
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
    .and("have.css", "align-items", "center")
    .and("have.css", "gap", "12px")
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
