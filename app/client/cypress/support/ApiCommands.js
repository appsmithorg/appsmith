/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import ApiEditor from "../locators/ApiEditor";

const apiwidget = require("../locators/apiWidgetslocator.json");
const explorer = require("../locators/explorerlocators.json");
import { ObjectsRegistry } from "./Objects/Registry";
import { PluginActionForm } from "./Pages/PluginActionForm";

let agHelper = ObjectsRegistry.AggregateHelper;
let dataSources = ObjectsRegistry.DataSources;
let apiPage = ObjectsRegistry.ApiPage;
let locator = ObjectsRegistry.CommonLocators;
let pluginActionForm = new PluginActionForm();

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("enterDatasourceAndPath", (datasource, path) => {
  cy.enterDatasource(datasource + path);
});

Cypress.Commands.add("enterDatasource", (datasource) => {
  cy.get(apiwidget.resourceUrl)
    .first()
    .click({ force: true })
    .type(datasource, { parseSpecialCharSequences: false });
  //.type("{esc}}");
  cy.wait(2000);
  agHelper.AssertAutoSave();
});

Cypress.Commands.add("ResponseStatusCheck", (statusCode) => {
  cy.xpath(apiwidget.responseStatus).should("be.visible");
  cy.xpath(apiwidget.responseStatus).contains(statusCode);
});

Cypress.Commands.add("ResponseCheck", () => {
  //Explicit assert
  cy.get(apiwidget.responseText).should("be.visible");
});

Cypress.Commands.add("ResponseTextCheck", (textTocheck) => {
  cy.ResponseCheck();
  cy.get(apiwidget.responseText).contains(textTocheck);
});

Cypress.Commands.add("NavigateToAPI_Panel", () => {
  dataSources.NavigateToDSCreateNew();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("CreateAPI", (apiname) => {
  apiPage.CreateApi(apiname);
});

Cypress.Commands.add("EditApiNameFromExplorer", (apiname) => {
  /*
    cy.xpath(apiwidget.popover)
      .last()
      .click({ force: true });
    cy.get(apiwidget.editName).click({ force: true });
    */
  cy.get(explorer.editNameField)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname)
    .blur({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
});

Cypress.Commands.add("RunAPI", () => {
  cy.get(ApiEditor.ApiRunBtn).click({ force: true });
  cy.wait("@postExecute");
});

Cypress.Commands.add("SaveAndRunAPI", () => {
  cy.WaitAutoSave();
  cy.RunAPI();
});

Cypress.Commands.add(
  "validateRequest",
  (apiName, baseurl, path, verb, error = false) => {
    cy.get(".ads-v2-tabs__list").contains("Logs").click();
    cy.get("[data-testid=t--debugger-search]").clear().type(apiName);
    agHelper.PressEnter(2000);
    if (!error) {
      cy.get(ApiEditor.apiResponseObject).last().contains("request").click();
    }
    cy.get(".string-value").contains(baseurl.concat(path));
    cy.get(".string-value").contains(verb);
    cy.get("[data-testid=t--tab-RESPONSE_TAB]").first().click({ force: true });
  },
);

Cypress.Commands.add("enterUrl", (baseUrl, url, value) => {
  cy.get(url).first().type(baseUrl.concat(value), {
    force: true,
    parseSpecialCharSequences: false,
  });
});

Cypress.Commands.add("CreationOfUniqueAPIcheck", (apiname) => {
  dataSources.NavigateToDSCreateNew();
  agHelper.GetNClick(apiwidget.createapi);
  cy.wait("@createNewApi");
  // cy.wait("@getUser");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  agHelper.RenameQuery(
    apiname,
    apiname.concat(" is already being used or is a restricted keyword."),
  );
});

Cypress.Commands.add("RenameEntity", (value, selectFirst) => {
  if (selectFirst) {
    cy.xpath(apiwidget.popover).first().click({ force: true });
  } else {
    cy.xpath(apiwidget.popover).last().click({ force: true });
  }

  cy.get(apiwidget.renameEntity).click({ force: true });
  cy.get(explorer.editEntity).last().type(value, { force: true });
});

Cypress.Commands.add("CreateApiAndValidateUniqueEntityName", (apiname) => {
  dataSources.NavigateToDSCreateNew();
  agHelper.GetNClick(apiwidget.createapi);
  cy.wait("@createNewApi");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  agHelper.RenameQuery(
    apiname,
    apiname.concat(" is already being used or is a restricted keyword."),
  );
});

Cypress.Commands.add("validateMessage", (value) => {
  cy.get(".rc-tooltip-inner").should(($x) => {
    expect($x).contain(value.concat(" is already being used."));
  });
});

Cypress.Commands.add("DeleteWidgetFromSideBar", () => {
  cy.xpath(apiwidget.popover).last().click({ force: true });
  cy.get(apiwidget.delete).click({ force: true });
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("DeleteAPI", () => {
  cy.get(ApiEditor.ApiActionMenu).click({ multiple: true });
  cy.get(apiwidget.deleteAPI).first().click({ force: true });
  cy.get(apiwidget.deleteAPI).first().click({ force: true });

  cy.wait("@deleteAction")
    .its("response.body.responseMeta.status")
    .should("eq", 200);
});

Cypress.Commands.add("testCreateApiButton", () => {
  agHelper.GetNClick(ApiEditor.createBlankApiCard);
  cy.wait("@createNewApi");
  cy.get("@createNewApi")
    .its("response.body.responseMeta.status")
    .should("eq", 201);
});

Cypress.Commands.add("createAndFillApi", (url, parameters) => {
  dataSources.NavigateToDSCreateNew();
  cy.testCreateApiButton();
  cy.get("@createNewApi").then((response) => {
    cy.get(locator._queryName).should("be.visible");
    expect(response.response.body.responseMeta.success).to.eq(true);
    cy.get(locator._queryName)
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal(response.response.body.data.name);
      });
  });

  cy.EnableAllCodeEditors();
  cy.updateCodeInput(ApiEditor.dataSourceField, url + parameters);
  cy.WaitAutoSave();
  cy.get(pluginActionForm.locators.actionRunButton).should("not.be.disabled");
});

// Cypress.Commands.add("callApi", (apiname) => {
//   cy.get(commonlocators.callApi).first().click({ force: true });
//   cy.get(commonlocators.singleSelectMenuItem)
//     .contains("Execute a query")
//     .click({ force: true });
//   cy.get(commonlocators.selectMenuItem)
//     .contains(apiname)
//     .click({ force: true });
// });
