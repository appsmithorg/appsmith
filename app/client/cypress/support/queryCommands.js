/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
import { ObjectsRegistry } from "../support/Objects/Registry";
import EditorNavigation, { EntityType } from "./Pages/EditorNavigation";
require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const jsEditorLocators = require("../locators/JSEditor.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const queryEditor = require("../locators/QueryEditor.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const datasource = require("../locators/DatasourcesEditor.json");
const formControls = require("../locators/FormControl.json");
const { AggregateHelper, PropertyPane } = ObjectsRegistry;

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("NavigateToDSGeneratePage", (datasourceName) => {
  EditorNavigation.SelectEntityByName(datasourceName, EntityType.Datasource);
  cy.get(datasource.datasourceCardGeneratePageBtn).click();
  cy.wait(2000); //for the specified page to load
});

Cypress.Commands.add("ClickGotIt", () => {
  cy.get("span:contains('Got it')").click();
});

Cypress.Commands.add("fillAuthenticatedAPIForm", () => {
  const URL = datasourceFormData["authenticatedApiUrl"];
  cy.get(datasourceEditor.url).type(URL);
});

Cypress.Commands.add("runQuery", (expectedRes = true) => {
  cy.onlyQueryRun();
  AggregateHelper.FailIfErrorToast("Failed to initialize pool");
  cy.wait(2000); //for postexecute to go thru
  cy.wait("@postExecute").should(
    "have.nested.property",
    "response.body.data.isExecutionSuccess",
    expectedRes,
  );

  // cy.wait("@postExecute").should(
  //   "have.nested.property",
  //   "response.body.responseMeta.status",
  //   200,
  // );
});

Cypress.Commands.add("onlyQueryRun", () => {
  cy.xpath(queryEditor.runQuery).last().click({ force: true }).wait(1000);
  cy.get(".ads-v2-spinner").should("not.exist");
});

Cypress.Commands.add("deleteQueryUsingContext", () => {
  cy.get(queryEditor.queryMoreAction).first().click();
  cy.get(queryEditor.deleteUsingContext).click();
  cy.get(queryEditor.deleteUsingContext).contains("Are you sure?").click();
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("runAndDeleteQuery", () => {
  cy.runQuery();
  cy.deleteQueryUsingContext();
});

Cypress.Commands.add("executeDbQuery", (queryName, eventName) => {
  PropertyPane.SelectPlatformFunction(eventName, "Execute a query");
  cy.get(`.single-select:contains(${queryName})`).click({ force: true });
  // cy.get(widgetsPage.buttonOnClick)
  //   .get(commonlocators.dropdownSelectButton)
  //   .eq(0)
  //   .click({ force: true })
  //   .get("ul.bp3-menu")
  //   .children()
  //   .contains("Execute a query")
  //   .click({ force: true })
  //   .get("ul.bp3-menu")
  //   .children()
  //   .contains(queryName)
  //   .click({ force: true });
});

Cypress.Commands.add("ValidateQueryParams", (param) => {
  cy.xpath(apiwidget.paramsTab).should("be.visible").click({ force: true });

  cy.validateCodeEditorContent(apiwidget.paramKey, param.key);
  cy.validateCodeEditorContent(apiwidget.paramValue, param.value);
});

// from hereeee
// targeting normal dropdowns, we can simply use the label names
Cypress.Commands.add(
  "TargetDropdownAndSelectOption",
  (dropdownIdentifier, option, isDynamic = false) => {
    if (isDynamic) {
      cy.wait(5000);
    }
    cy.get(dropdownIdentifier)
      .scrollIntoView()
      .should("be.visible")
      .click({ multiple: true });

    cy.get(formControls.dropdownWrapper)
      .should("be.visible")
      .contains(option)
      .first()
      .click({ force: true });
    cy.wait(2000);
  },
);

Cypress.Commands.add(
  "VerifyCurrentDropdownOption",
  (dropdownIdentifier, option) => {
    cy.get(dropdownIdentifier)
      .scrollIntoView()
      .should("be.visible")
      .contains(option)
      .should("be.visible");
  },
);

Cypress.Commands.add(
  "ValidateAndSelectDropdownOption",
  (dropdownIdentifier, currentOption, newOption, isDynamic = false) => {
    cy.VerifyCurrentDropdownOption(dropdownIdentifier, currentOption);
    if (newOption) {
      cy.TargetDropdownAndSelectOption(
        dropdownIdentifier,
        newOption,
        isDynamic,
      );
      cy.wait(2000);
    }
  },
);
