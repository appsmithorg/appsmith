/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const jsEditorLocators = require("../locators/JSEditor.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const widgetsPage = require("../locators/Widgets.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");
const formControls = require("../locators/FormControl.json");
const queryLocators = require("../locators/QueryEditor.json");

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("NavigateToQueryEditor", () => {
  cy.get(explorer.addDBQueryEntity)
    .last()
    .click({ force: true });
});

Cypress.Commands.add("NavigateToQueriesInExplorer", () => {
  cy.get(explorer.entityQuery).click({ force: true });
});

Cypress.Commands.add("NavigateToActiveDSQueryPane", (datasourceName) => {
  cy.NavigateToQueryEditor();
  cy.NavigateToActiveTab();

  cy.get(datasource.datasourceCard)
    .contains(datasourceName)
    .scrollIntoView()
    .should("be.visible")
    .closest(datasource.datasourceCard)
    .within(() => {
      cy.get(queryLocators.createQuery).click({ force: true });
    })
    .wait(2000); //for the specified page to load
});

Cypress.Commands.add("NavigateToDSGeneratePage", (datasourceName) => {
  cy.NavigateToQueryEditor();
  cy.NavigateToActiveTab();

  cy.get(datasource.datasourceCard)
    .contains(datasourceName)
    .scrollIntoView()
    .should("be.visible")
    .closest(datasource.datasourceCard)
    .within(() => {
      cy.get(datasource.datasourceCardGeneratePageBtn).click();
    })
    .wait(2000); //for the specified page to load
});

Cypress.Commands.add("ClickGotIt", () => {
  cy.get("span:contains('GOT IT')").click();
});

Cypress.Commands.add("fillGoogleSheetsDatasourceForm", () => {
  cy.get(datasourceEditor["scope"]).click();
});

Cypress.Commands.add("fillAuthenticatedAPIForm", () => {
  const URL = datasourceFormData["authenticatedApiUrl"];
  cy.get(datasourceEditor.url).type(URL);
});

Cypress.Commands.add("runQuery", (expectedRes = true) => {
  cy.onlyQueryRun();
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
  cy.xpath(queryEditor.runQuery)
    .last()
    .click({ force: true })
    .wait(1000);
});

Cypress.Commands.add("RunQueryWithoutWaitingForResolution", () => {
  cy.xpath(queryEditor.runQuery)
    .last()
    .click({ force: true });
});

Cypress.Commands.add("hoverAndClick", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .should("be.hidden")
    .invoke("show")
    .click({ force: true });
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
});

Cypress.Commands.add("hoverAndClickParticularIndex", (index) => {
  cy.xpath(apiwidget.popover)
    .eq(index)
    .should("be.hidden")
    .invoke("show")
    .click({ force: true });
});

Cypress.Commands.add("deleteQuery", () => {
  cy.hoverAndClick();
  cy.get(apiwidget.delete).click({ force: true });
  cy.get(apiwidget.deleteConfirm).click({ force: true });
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("deleteQueryUsingContext", () => {
  cy.get(queryEditor.queryMoreAction)
    .first()
    .click();
  cy.get(queryEditor.deleteUsingContext).click();
  cy.get(queryEditor.deleteUsingContext)
    .contains("Are you sure?")
    .click();
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

Cypress.Commands.add("executeDbQuery", (queryName) => {
  cy.get(widgetsPage.buttonOnClick)
    .get(commonlocators.dropdownSelectButton)
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains("Execute a query")
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains(queryName)
    .click({ force: true });
});

Cypress.Commands.add("CreateMockQuery", (queryName) => {
  // cy.get(queryEditor.addNewQueryBtn).click({ force: true });
  // cy.get(queryEditor.createQuery)
  //   .first()
  //   .click({ force: true });
  cy.get(queryEditor.queryNameField).type(queryName + "{enter}", {
    force: true,
  });
  cy.assertPageSave();
  cy.get(queryEditor.templateMenu + " div")
    .contains("Select")
    .click({ force: true });
  cy.runQuery();
  // cy.wait(3000);
  // cy.get(queryEditor.runQuery)
  //   .click({force: true});
});

Cypress.Commands.add("ValidateQueryParams", (param) => {
  cy.xpath(apiwidget.paramsTab)
    .should("be.visible")
    .click({ force: true });

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
      .click();
  },
);

// targeting multiselect dropdowns, we target the data-cy value of the options
Cypress.Commands.add(
  "TargetMultiSelectDropdownAndSelectOptions",
  (dropdownIdentifier, options, isDynamic = false) => {
    if (isDynamic) {
      cy.wait(5000);
    }
    cy.get(dropdownIdentifier)
      .scrollIntoView()
      .should("be.visible")
      .click({ multiple: true });

    options &&
      options.map((option) => {
        cy.get(formControls.dropdownWrapper)
          .should("be.visible")
          .get(option) //  we use a get instead of contains.
          .first()
          .click({ force: true });
      });
  },
);

Cypress.Commands.add(
  "TargetFormControlAndSwitchViewType",
  (formControlIdentifier, newViewType) => {
    cy.get(formControlIdentifier)
      .scrollIntoView()
      .should("be.visible")
      .click();

    if (newViewType === "json") {
      cy.get(formControlIdentifier)
        .should("be.visible")
        .should("have.class", "is-active");
    } else if (newViewType === "component") {
      cy.get(formControlIdentifier)
        .should("be.visible")
        .should("not.have.class", "is-active");
    }
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
    }
  },
);

Cypress.Commands.add("NavigateToAction", (actionName) => {
  cy.get(queryEditor.navigateToAction)
    .contains(actionName)
    .should("be.visible")
    .click();
});
Cypress.Commands.add("SelecJSFunctionAndRun", (functionName) => {
  cy.xpath("//span[@name='expand-more']")
    .first()
    .click();
  cy.get(`[data-cy='t--dropdown-option-${functionName}']`).click();
  cy.get(jsEditorLocators.runButton)
    .first()
    .click();
});
