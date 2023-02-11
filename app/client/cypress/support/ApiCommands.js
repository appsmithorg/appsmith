/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import ApiEditor from "../locators/ApiEditor";
const pages = require("../locators/Pages.json");
const commonlocators = require("../locators/commonlocators.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const explorer = require("../locators/explorerlocators.json");

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
  cy.assertPageSave();
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
  cy.get(pages.addEntityAPI)
    .last()
    .should("be.visible")
    .click({ force: true });
  cy.get(pages.integrationCreateNew)
    .should("be.visible")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("CreateAPI", (apiname) => {
  cy.get(explorer.createNew).click({ force: true });
  cy.get(explorer.blankAPI).click({ force: true });
  cy.wait("@createNewApi");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  if (apiname) {
    cy.renameWithInPane(apiname);
    cy.WaitAutoSave();
  }
  // Added because api name edit takes some time to
  // reflect in api sidebar after the call passes.
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("CreateSubsequentAPI", (apiname) => {
  cy.get(apiwidget.createApiOnSideBar)
    .first()
    .click({ force: true });
  cy.get(apiwidget.resourceUrl).should("be.visible");
  // cy.get(ApiEditor.nameOfApi)
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname)
    .should("have.value", apiname);
  cy.WaitAutoSave();
});

Cypress.Commands.add("EditApiName", (apiname) => {
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname);
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
    .blur();
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
});

Cypress.Commands.add("RunAPI", () => {
  cy.get(ApiEditor.ApiRunBtn).click({ force: true });
  cy.wait("@postExecute");
});

Cypress.Commands.add("RunAPIWithoutWaitingForResolution", () => {
  cy.get(ApiEditor.ApiRunBtn).click({ force: true });
});

Cypress.Commands.add("SaveAndRunAPI", () => {
  cy.WaitAutoSave();
  cy.RunAPI();
});

Cypress.Commands.add(
  "validateRequest",
  (apiName, baseurl, path, verb, error = false) => {
    cy.get(".react-tabs__tab")
      .contains("Logs")
      .click();
    cy.get("[data-cy=t--debugger-search]")
      .clear()
      .type(apiName);

    if (!error) {
      cy.get(".object-key")
        .last()
        .contains("request")
        .click();
    }
    cy.get(".string-value").contains(baseurl.concat(path));
    cy.get(".string-value").contains(verb);
    cy.get("[data-cy=t--tab-response]")
      .first()
      .click({ force: true });
  },
);

Cypress.Commands.add(
  "EnterSourceDetailsWithHeader",
  (baseUrl, v1method, hKey, hValue) => {
    cy.enterDatasourceAndPath(baseUrl, v1method);
    cy.get(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type(hKey, { parseSpecialCharSequences: true });
    cy.get(apiwidget.headerValue)
      .first()
      .click({ force: true })
      .type(hValue, { parseSpecialCharSequences: true });
    cy.WaitAutoSave();
  },
);

Cypress.Commands.add("EditSourceDetail", (baseUrl, v1method) => {
  cy.get(apiwidget.editResourceUrl)
    .first()
    .click({ force: true })
    .clear()
    .type(`{backspace}${baseUrl}`);
  cy.xpath(apiwidget.autoSuggest)
    .first()
    .click({ force: true });
  cy.get(ApiEditor.ApiRunBtn).scrollIntoView();
  cy.get(apiwidget.editResourceUrl)
    .first()
    .focus()
    .type(v1method)
    .should("have.value", v1method);
  cy.WaitAutoSave();
});

Cypress.Commands.add("switchToAPIInputTab", () => {
  cy.get(apiwidget.apiInputTab)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("enterUrl", (apiname, url, value) => {
  cy.get(url)
    .first()
    .type("{{".concat(apiname).concat(value), {
      force: true,
      parseSpecialCharSequences: false,
    });
});

Cypress.Commands.add(
  "EnterSourceDetailsWithQueryParam",
  (baseUrl, v1method, hKey, hValue, qKey, qValue) => {
    cy.enterDatasourceAndPath(baseUrl, v1method);
    cy.get(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type(hKey, { parseSpecialCharSequences: true });
    cy.get(apiwidget.headerValue)
      .first()
      .click({ force: true })
      .type(hValue, { parseSpecialCharSequences: true });
    cy.get(apiwidget.queryKey)
      .first()
      .click({ force: true })
      .type(qKey, { force: true })
      .should("have.value", qKey);
    cy.get(apiwidget.queryValue)
      .first()
      .click({ force: true })
      .type(qValue, { force: true })
      .should("have.value", qValue);
    cy.WaitAutoSave();
  },
);

Cypress.Commands.add("EnterSourceDetailsWithbody", (baseUrl, v1method) => {
  cy.enterDatasourceAndPath(baseUrl, v1method);
  cy.get(apiwidget.addHeader)
    .first()
    .click({ first: true });
});

Cypress.Commands.add("CreationOfUniqueAPIcheck", (apiname) => {
  cy.get(pages.addEntityAPI).click();
  cy.get(pages.integrationCreateNew)
    .should("be.visible")
    .click({ force: true });
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@createNewApi");
  // cy.wait("@getUser");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .focus()
    .type(apiname, { force: true, delay: 500 })
    .should("have.value", apiname);
  cy.get(".t--action-name-edit-error").should(($x) => {
    expect($x).contain(
      apiname.concat(" is already being used or is a restricted keyword."),
    );
  });
  cy.get(apiwidget.apiTxt).blur();
});

Cypress.Commands.add("MoveAPIToHome", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.home).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("MoveAPIToPage", (pageName) => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.moveTo).click({ force: true });
  cy.get(apiwidget.page)
    .contains(pageName)
    .click({ force: true });
  cy.wait("@moveAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("copyEntityToPage", (pageName) => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.page)
    .contains(pageName)
    .click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("CopyAPIToHome", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.home).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("RenameEntity", (value, selectFirst) => {
  if (selectFirst) {
    cy.xpath(apiwidget.popover)
      .first()
      .click({ force: true });
  } else {
    cy.xpath(apiwidget.popover)
      .last()
      .click({ force: true });
  }

  cy.get(apiwidget.renameEntity).click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(explorer.editEntity)
    .last()
    .type(value, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
});

Cypress.Commands.add("CreateApiAndValidateUniqueEntityName", (apiname) => {
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@createNewApi");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname);
  cy.get(".t--action-name-edit-error").should(($x) => {
    expect($x).contain(
      apiname.concat(" is already being used or is a restricted keyword."),
    );
  });
});

Cypress.Commands.add("validateMessage", (value) => {
  cy.get(".bp3-popover-content").should(($x) => {
    expect($x).contain(value.concat(" is already being used."));
  });
});

Cypress.Commands.add(
  "VerifyPopOverMessage",
  (msgAbsenceToVerify, presence = false) => {
    // Give this element 3 seconds to appear
    let shouldCondition = "not.exist";
    if (presence) shouldCondition = "exist";
    cy.xpath(
      "//div[@class='bp3-popover-content'][contains(text(),'" +
        msgAbsenceToVerify +
        "')]",
      { timeout: 3000 },
    ).should(shouldCondition);
  },
);

Cypress.Commands.add("DeleteAPIFromSideBar", () => {
  cy.deleteEntity();
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("DeleteWidgetFromSideBar", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.delete).click({ force: true });
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("deleteEntity", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.delete).click({ force: true });
  cy.get(apiwidget.deleteConfirm).click({ force: true });
});

Cypress.Commands.add("deleteEntityWithoutConfirmation", () => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.delete).click({ force: true });
});

Cypress.Commands.add("DeleteAPI", () => {
  cy.get(ApiEditor.ApiActionMenu).click({ multiple: true });
  cy.get(apiwidget.deleteAPI)
    .first()
    .click({ force: true });
  cy.get(apiwidget.deleteAPI)
    .first()
    .click({ force: true });
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("NavigateToApiEditor", () => {
  cy.get(explorer.addEntityAPI).click({ force: true });
});

Cypress.Commands.add("testCreateApiButton", () => {
  cy.get(ApiEditor.createBlankApiCard).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("createAndFillApi", (url, parameters) => {
  cy.NavigateToApiEditor();
  cy.get(pages.integrationCreateNew)
    .should("be.visible")
    .click({ force: true });
  cy.testCreateApiButton();
  cy.get("@createNewApi").then((response) => {
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    expect(response.response.body.responseMeta.success).to.eq(true);
    cy.get(ApiEditor.ApiNameField)
      .click()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal(response.response.body.data.name);
      });
  });
  cy.get(apiwidget.editResourceUrl)
    .first()
    .click({ force: true })
    .type(
      url + parameters,
      { parseSpecialCharSequences: false },
      { force: true },
    );
  cy.WaitAutoSave();
  cy.get(ApiEditor.formActionButtons).should("be.visible");
  cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
});

Cypress.Commands.add("callApi", (apiname) => {
  cy.get(commonlocators.callApi)
    .first()
    .click({ force: true });
  cy.get(commonlocators.singleSelectMenuItem)
    .contains("Execute a query")
    .click({ force: true });
  cy.get(commonlocators.selectMenuItem)
    .contains(apiname)
    .click({ force: true });
});

Cypress.Commands.add("checkIfApiPaneIsVisible", () => {
  cy.get(ApiEditor.datasourcesRightPane).should("exist");
  cy.get(ApiEditor.datasourcesRightPane).should("be.visible");
});
