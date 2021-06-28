/// <reference types="Cypress" />
/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cypress-file-upload");

const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
const ApiEditor = require("../locators/ApiEditor.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");
const viewWidgetsPage = require("../locators/ViewWidgets.json");

let pageidcopy = " ";

Cypress.Commands.add("createOrg", () => {
  cy.get(homePage.createOrg)
    .should("be.visible")
    .first()
    .click({ force: true });
});

Cypress.Commands.add("renameOrg", (orgName, newOrgName) => {
  cy.contains(orgName).click({ force: true });
  cy.get(homePage.renameOrgInput)
    .should("be.visible")
    .type(newOrgName)
    .type("{enter}");
  cy.contains(newOrgName);
});

Cypress.Commands.add(
  "dragTo",
  { prevSubject: "element" },
  (subject, targetEl) => {
    cy.wrap(subject).trigger("dragstart");
    cy.get(targetEl).trigger("drop");
  },
);

Cypress.Commands.add("navigateToOrgSettings", (orgName) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(".t--org-name span")
    .contains(orgName)
    .first()
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getOrganisation");
  cy.wait("@getRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.inviteUserMembersPage).should("be.visible");
});

Cypress.Commands.add("openOrgOptionsPopup", (orgName) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(".t--org-name span")
    .contains(orgName)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("inviteUserForOrg", (orgName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(homePage.orgList.concat(orgName).concat(homePage.shareOrg))
    .first()
    .should("be.visible")
    .click();
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email);
});

Cypress.Commands.add("CheckShareIcon", (orgName, count) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(
    homePage.orgList.concat(orgName).concat(") .org-share-user-icons"),
  ).should("have.length", count);
});

Cypress.Commands.add("stubPostHeaderReq", () => {
  cy.intercept("POST", "/api/v1/users/invite", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("mockPostInvite");
});

Cypress.Commands.add("shareApp", (email, role) => {
  cy.stubPostHeaderReq();
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email);
  cy.get(homePage.closeBtn).click();
});

Cypress.Commands.add("shareAndPublic", (email, role) => {
  cy.stubPostHeaderReq();
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email);
  cy.enablePublicAccess();
});

Cypress.Commands.add("enablePublicAccess", () => {
  cy.get(homePage.enablePublicAccess).click();
  cy.wait("@changeAccess").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.closeBtn).click();
});

Cypress.Commands.add("deleteUserFromOrg", (orgName, email) => {
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(".t--org-name span")
    .contains(orgName)
    .first()
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getOrganisation");
  cy.wait("@getRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.DeleteBtn)
    .last()
    .click({ force: true });
  cy.get(homePage.leaveOrgConfirmModal).should("be.visible");
  cy.get(homePage.leaveOrgConfirmButton).click({ force: true });
  cy.xpath(homePage.appHome)
    .first()
    .should("be.visible")
    .click();
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("updateUserRoleForOrg", (orgName, email, role) => {
  cy.stubPostHeaderReq();
  cy.get(homePage.orgList.concat(orgName).concat(")"))
    .scrollIntoView()
    .should("be.visible");
  cy.get(".t--org-name span")
    .contains(orgName)
    .first()
    .click({ force: true });
  cy.xpath(homePage.MemberSettings).click({ force: true });
  cy.wait("@getRoles").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(homePage.inviteUserMembersPage).click({ force: true });
  cy.xpath(homePage.email)
    .click({ force: true })
    .type(email);
  cy.xpath(homePage.selectRole).click({ force: true });
  cy.xpath(role).click({ force: true });
  cy.xpath(homePage.inviteBtn).click({ force: true });
  cy.wait("@mockPostInvite")
    .its("request.headers")
    .should("have.property", "origin", "Cypress");
  cy.contains(email);
  cy.get(".bp3-icon-small-cross").click({ force: true });
  cy.xpath(homePage.appHome)
    .first()
    .should("be.visible")
    .click();
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("launchApp", (appName) => {
  cy.get(homePage.appView)
    .should("be.visible")
    .first()
    .click();
  cy.get("#loading").should("not.exist");
  cy.wait("@getPagesForViewApp").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("CreateAppForOrg", (orgName, appname) => {
  cy.get(homePage.orgList.concat(orgName).concat(homePage.createAppFrOrg))
    .scrollIntoView()
    .should("be.visible")
    .click({ force: true });
  cy.wait("@createNewApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
  cy.get(homePage.applicationName).type(appname + "{enter}");
  cy.wait("@updateApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("CreateAppInFirstListedOrg", (appname) => {
  cy.get(homePage.createNew)
    .first()
    .click({ force: true });
  cy.wait("@createNewApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  cy.get("#loading").should("not.exist");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);

  cy.get(homePage.applicationName).type(appname + "{enter}");
  cy.wait("@updateApplication").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  /* The server created app always has an old dsl so the layout will migrate
   * To avoid race conditions between that update layout and this one
   * we wait for that to finish before updating layout here
   */
  cy.wait("@updateLayout");
});

Cypress.Commands.add(
  "addOauthAuthDetails",
  (accessTokenUrl, clientId, clientSecret, authURL) => {
    cy.get(datasource.authType).click();
    cy.xpath(datasource.OAuth2).click();
    cy.get(datasource.grantType).click();
    cy.xpath(datasource.authorisecode).click();
    cy.get(datasource.accessTokenUrl).type(accessTokenUrl);
    cy.get(datasource.clienID).type(clientId);
    cy.get(datasource.clientSecret).type(clientSecret);
    cy.get(datasource.authorizationURL).type(authURL);
    cy.xpath('//input[contains(@value,"api/v1/datasources/authorize")]')
      .first()
      .invoke("attr", "value")
      .then((text) => {
        const firstTxt = text;
        cy.log("date time : ", firstTxt);
        const expectedvalue = Cypress.config().baseUrl.concat(
          "api/v1/datasources/authorize",
        );
        expect(firstTxt).to.equal(expectedvalue);
      });
  },
);

Cypress.Commands.add("addBasicProfileDetails", (username, password) => {
  cy.get(datasource.authType).click();
  cy.xpath(datasource.basic).click();
  cy.get(datasource.basicUsername).type(username);
  cy.get(datasource.basicPassword).type(password);
});

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

Cypress.Commands.add("DeleteApp", (appName) => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait("@organizations").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get('button span[icon="chevron-down"]').should("be.visible");
  cy.get(homePage.searchInput).type(appName, { force: true });
  cy.get(homePage.applicationCard).trigger("mouseover");
  cy.get(homePage.appMoreIcon)
    .should("have.length", 1)
    .first()
    .click({ force: true });
  cy.get(homePage.deleteAppConfirm)
    .should("be.visible")
    .click({ force: true });
  cy.get(homePage.deleteApp)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.window()
    .its("store")
    .invoke("dispatch", { type: "LOGOUT_USER_INIT" });
  cy.wait("@postLogout");

  cy.visit("/user/login");
  cy.get(loginPage.username).should("be.visible");
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword);
  cy.get(loginPage.submitBtn).click();
  cy.wait("@getUser").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("LoginFromAPI", (uname, pword) => {
  cy.request({
    method: "POST",
    url: "api/v1/login",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    followRedirect: false,
    form: true,
    body: {
      username: uname,
      password: pword,
    },
  }).then((response) => {
    expect(response.status).equal(302);
    cy.log(response.body);
  });
});

Cypress.Commands.add("DeleteApp", (appName) => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.get(homePage.searchInput).type(appName);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(homePage.applicationCard)
    .first()
    .trigger("mouseover");
  cy.get(homePage.appMoreIcon)
    .first()
    .click({ force: true });
  cy.get(homePage.deleteAppConfirm)
    .should("be.visible")
    .click({ force: true });
  cy.get(homePage.deleteApp)
    .contains("Are you sure?")
    .click({ force: true });
});

Cypress.Commands.add("DeletepageFromSideBar", () => {
  cy.xpath(pages.popover)
    .last()
    .click({ force: true });
  cy.get(pages.deletePage)
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("LogOut", () => {
  cy.request("POST", "/api/v1/logout");
});

Cypress.Commands.add("NavigateToHome", () => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("NavigateToWidgets", (pageName) => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(".t--page-sidebar-" + pageName + "")
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.wait("@getPage");
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("SearchApp", (appname) => {
  cy.get(homePage.searchInput).type(appname);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(homePage.applicationCard)
    .first()
    .trigger("mouseover", { force: true });
  cy.get(homePage.appEditIcon)
    .first()
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  // Wait added because after opening the application editor, sometimes it takes a little time.
});

Cypress.Commands.add("SearchEntity", (apiname1, apiname2) => {
  cy.get(commonlocators.entityExplorersearch)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(
    commonlocators.entitySearchResult.concat(apiname2).concat("')"),
  ).should("not.exist");
});

Cypress.Commands.add("GlobalSearchEntity", (apiname1) => {
  // entity explorer search will be hidden
  cy.get(commonlocators.entityExplorersearch)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
});

Cypress.Commands.add("ResponseStatusCheck", (statusCode) => {
  cy.xpath(apiwidget.responseStatus).should("be.visible");
  cy.xpath(apiwidget.responseStatus).contains(statusCode);
});

Cypress.Commands.add("ResponseCheck", (textTocheck) => {
  //Explicit assert
  cy.get(apiwidget.responseText).should("be.visible");
});

Cypress.Commands.add("ResponseTextCheck", (textTocheck) => {
  cy.ResponseCheck();
  cy.get(apiwidget.responseText).contains(textTocheck);
});

Cypress.Commands.add("NavigateToAPI_Panel", () => {
  cy.get(pages.addEntityAPI)
    .should("be.visible")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToEntityExplorer", () => {
  cy.get(explorer.entityExplorer)
    .should("be.visible")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("CreateAPI", (apiname) => {
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@createNewApi");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname)
    .blur();
  cy.WaitAutoSave();
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
  cy.WaitAutoSave();
});

Cypress.Commands.add("EditApiNameFromExplorer", (apiname) => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.editName).click({ force: true });
  cy.get(explorer.editNameField)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname)
    .blur();
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
});

Cypress.Commands.add(
  "EditEntityNameByDoubleClick",
  (entityName, updatedName) => {
    cy.get(explorer.entity)
      .contains(entityName)
      .dblclick({ force: true });
    cy.log(updatedName);
    cy.get(explorer.editEntityField)
      .clear()
      .type(updatedName + "{enter}", { force: true });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  },
);

Cypress.Commands.add("WaitAutoSave", () => {
  // wait for save query to trigger
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.wait("@saveAction");
  //cy.wait("@postExecute");
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
  (baseurl, path, verb, error = false) => {
    cy.get(".react-tabs__tab")
      .contains("Logs")
      .click();

    if (!error) {
      cy.get(".object-key")
        .last()
        .contains("request")
        .click();
    }
    cy.get(".string-value").contains(baseurl.concat(path));
    cy.get(".string-value").contains(verb);
    cy.xpath(apiwidget.Responsetab)
      .should("be.visible")
      .click({ force: true });
  },
);

Cypress.Commands.add("SelectAction", (action) => {
  cy.get(ApiEditor.ApiVerb)
    .first()
    .click({ force: true });
  cy.xpath(action)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("ClearSearch", () => {
  cy.get(commonlocators.entityExplorersearch).clear({ force: true });
});

Cypress.Commands.add(
  "paste",
  {
    prevSubject: true,
    element: true,
  },
  ($element, text) => {
    const subString = text.substr(0, text.length - 1);
    const lastChar = text.slice(-1);

    cy.get(commonlocators.entityExplorersearch)
      .clear({ force: true })
      .click({ force: true })
      .then(() => {
        $element.text(subString);
        $element.val(subString);
        cy.get($element).type(lastChar);
      });
  },
);

Cypress.Commands.add("SearchEntityandOpen", (apiname1) => {
  cy.get(commonlocators.entityExplorersearch)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .last()
    .click({ force: true });
});

Cypress.Commands.add("enterDatasourceAndPath", (datasource, path) => {
  cy.enterDatasource(datasource);
  cy.get(apiwidget.editResourceUrl)
    .first()
    .click({ force: true })
    .type(path, { parseSpecialCharSequences: false });
});

Cypress.Commands.add("enterDatasource", (datasource) => {
  cy.get(apiwidget.resourceUrl)
    .first()
    .click({ force: true })
    .type(datasource);
});

Cypress.Commands.add("changeZoomLevel", (zoomValue) => {
  cy.get(commonlocators.changeZoomlevel)
    .last()
    .click();
  cy.get(".t--dropdown-option")
    .children()
    .contains(zoomValue)
    .click();
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(commonlocators.selectedZoomlevel)
    .last()
    .invoke("text")
    .then((text) => {
      const someText = text;
      expect(someText).to.equal(zoomValue);
    });
});

Cypress.Commands.add("changeColumnType", (dataType) => {
  cy.get(commonlocators.changeColType)
    .last()
    .click();
  cy.get(".t--dropdown-option")
    .children()
    .contains(dataType)
    .click();
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  /*
  cy.get(commonlocators.selectedColType)
    .first()
    .invoke("text")
    .then((text) => {
      const someText = text;
      expect(someText).to.equal(dataType);
    });
    */
});

Cypress.Commands.add(
  "EnterSourceDetailsWithHeader",
  (baseUrl, v1method, hKey, hValue) => {
    cy.enterDatasourceAndPath(baseUrl, v1method);
    cy.xpath(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type(hKey, { force: true })
      .should("have.value", hKey);
    cy.xpath(apiwidget.headerValue)
      .first()
      .click({ force: true })
      .type(hValue, { force: true })
      .should("have.value", hValue);
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

Cypress.Commands.add("switchToPaginationTab", () => {
  cy.get(apiwidget.paginationTab)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("switchToAPIInputTab", () => {
  cy.get(apiwidget.apiInputTab)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("selectDateFormat", (value) => {
  cy.get(".t--property-control-dateformat .bp3-popover-target")
    .last()
    .click({ force: true });
  cy.get(".t--dropdown-option")
    .children()
    .contains(value)
    .click();
});

Cypress.Commands.add("assertDateFormat", () => {
  cy.get(".t--draggable-datepickerwidget2 input")
    .first()
    .invoke("attr", "value")
    .then((text) => {
      const firstTxt = text;
      cy.log("date time : ", firstTxt);
      cy.get(commonlocators.labelTextStyle)
        .first()
        .should("contain", firstTxt);
      cy.get(commonlocators.labelTextStyle)
        .last()
        .invoke("text")
        .then((text) => {
          const secondText = text;
          cy.log("date time : ", secondText);
          expect(firstTxt).not.to.equal(secondText);
        });
    });
});

Cypress.Commands.add("selectPaginationType", (option) => {
  cy.xpath(option).click({ force: true });
});

Cypress.Commands.add("clickTest", (testbutton) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.wait("@saveAction");
  cy.get(testbutton)
    .first()
    .click({ force: true });
  cy.wait("@postExecute");
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
    cy.xpath(apiwidget.headerKey)
      .first()
      .click({ force: true })
      .type(hKey, { force: true })
      .should("have.value", hKey);
    cy.xpath(apiwidget.headerValue)
      .first()
      .click({ force: true })
      .type(hValue, { force: true })
      .should("have.value", hValue);
    cy.xpath(apiwidget.queryKey)
      .first()
      .click({ force: true })
      .type(qKey, { force: true })
      .should("have.value", qKey);
    cy.xpath(apiwidget.queryValue)
      .first()
      .click({ force: true })
      .type(qValue, { force: true })
      .should("have.value", qValue);
    cy.WaitAutoSave();
  },
);

Cypress.Commands.add(
  "EnterSourceDetailsWithbody",
  (baseUrl, v1method, hKey, hValue) => {
    cy.enterDatasourceAndPath(baseUrl, v1method);
    cy.get(apiwidget.addHeader)
      .first()
      .click({ first: true });
  },
);

Cypress.Commands.add("CreationOfUniqueAPIcheck", (apiname) => {
  cy.get(pages.addEntityAPI).click();
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@createNewApi");
  // cy.wait("@getUser");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname, { force: true })
    .should("have.value", apiname)
    .focus();
  cy.get(".error-message").should(($x) => {
    console.log($x);
    expect($x).contain(apiname.concat(" is already being used."));
  });
  cy.get(apiwidget.apiTxt).blur();
});

Cypress.Commands.add("MoveAPIToHome", (apiname) => {
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
    .click();
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
    .click();
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

Cypress.Commands.add("RenameEntity", (value) => {
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
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
  cy.get(".t--nameOfApi .error-message").should(($x) => {
    console.log($x);
    expect($x).contain(apiname.concat(" is already being used."));
  });
});

Cypress.Commands.add("validateMessage", (value) => {
  cy.get(".bp3-popover-content").should(($x) => {
    console.log($x);
    expect($x).contain(value.concat(" is already being used."));
  });
});

Cypress.Commands.add("DeleteAPIFromSideBar", () => {
  cy.deleteEntity();
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("DeleteWidgetFromSideBar", () => {
  cy.deleteEntity();
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
});

Cypress.Commands.add("DeleteAPI", (apiname) => {
  cy.get(ApiEditor.ApiActionMenu)
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

Cypress.Commands.add("AddActionWithModal", () => {
  cy.get(commonlocators.dropdownSelectButton)
    .last()
    .click();
  cy.get(".single-select")
    .contains("Open Modal")
    .click({ force: true });
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
  cy.get(commonlocators.editPropCrossButton).click({ force: true });
});

Cypress.Commands.add("createModal", (modalType, ModalName) => {
  cy.get(widgetsPage.actionSelect)
    .first()
    .click({ force: true });
  cy.selectOnClickOption("Open Modal");
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });

  cy.get(modalWidgetPage.controlModalType)
    .last()
    .click({ force: true });
  cy.get(commonlocators.dropdownmenu)
    .children()
    .contains(modalType)
    .click();
  cy.assertPageSave();

  // changing the model name verify
  cy.widgetText(
    ModalName,
    modalWidgetPage.modalName,
    modalWidgetPage.modalName,
  );
  cy.get(commonlocators.editPropCrossButton).click({ force: true });

  //changing the Model label
  cy.get(modalWidgetPage.modalWidget + " " + widgetsPage.textWidget)
    .first()
    .trigger("mouseover");

  cy.get(widgetsPage.textWidget + " " + commonlocators.editIcon).click();
  cy.testCodeMirror(ModalName);
  cy.get(widgetsPage.textCenterAlign).click({ force: true });
  cy.assertPageSave();
  cy.get(".bp3-overlay-backdrop").click({ force: true });
});

Cypress.Commands.add("selectOnClickOption", (option) => {
  cy.get("ul.bp3-menu div.bp3-fill")
    .wait(500)
    .contains(option)
    .click({ force: true });
});

Cypress.Commands.add("updateModal", (modalType, ModalName) => {
  cy.get(widgetsPage.actionSelect)
    .first()
    .click({ force: true });
  cy.selectOnClickOption("Open Modal");
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });

  cy.get(modalWidgetPage.controlModalType)
    .last()
    .click({ force: true });
  cy.get(commonlocators.dropdownmenu)
    .children()
    .contains(modalType)
    .click();
  cy.assertPageSave();

  // changing the model name verify
  cy.widgetText(
    ModalName,
    modalWidgetPage.modalName,
    modalWidgetPage.modalName,
  );
  cy.get(commonlocators.editPropCrossButton).click({ force: true });

  //changing the Model label
  cy.get(modalWidgetPage.modalWidget + " " + widgetsPage.textWidget)
    .first()
    .trigger("mouseover");

  cy.get(widgetsPage.textWidget + " " + commonlocators.editIcon).click();
  cy.testCodeMirror(ModalName);
  cy.get(widgetsPage.textCenterAlign).click({ force: true });
  cy.assertPageSave();
  cy.get(".bp3-overlay-backdrop").click({ force: true });
});
Cypress.Commands.add("CheckWidgetProperties", (checkboxCss) => {
  cy.get(checkboxCss).check({
    force: true,
  });
  cy.assertPageSave();
});

Cypress.Commands.add("UncheckWidgetProperties", (checkboxCss) => {
  cy.get(checkboxCss).uncheck({
    force: true,
  });
  cy.assertPageSave();
});

Cypress.Commands.add("EditWidgetPropertiesUsingJS", (checkboxCss, inputJS) => {
  cy.get(checkboxCss)
    .click()
    .type(inputJS);
  cy.assertPageSave();
});

Cypress.Commands.add(
  "ChangeTextStyle",
  (dropDownValue, textStylecss, labelName) => {
    cy.get(commonlocators.dropDownIcon)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains(dropDownValue)
      .click();
    cy.get(textStylecss).should("have.text", labelName);
  },
);

Cypress.Commands.add("widgetText", (text, inputcss, innercss) => {
  cy.get(commonlocators.editWidgetName)
    .click({ force: true })
    .type(text, { delay: 300 })
    .type("{enter}");
  cy.get(inputcss)
    .first()
    .trigger("mouseover", { force: true });
  cy.contains(innercss, text);
});

Cypress.Commands.add("editColName", (text) => {
  cy.get(commonlocators.editColTitle)
    .click({ force: true })
    .type(text)
    .type("{enter}");
  cy.get(commonlocators.editColText).should("have.text", text);
});

Cypress.Commands.add("invalidWidgetText", () => {
  // checking invalid widget name
  cy.get(commonlocators.editWidgetName)
    .click({ force: true })
    .type("download")
    .type("{enter}");
  cy.get(commonlocators.toastmsg).contains("download is already being used.");
});

Cypress.Commands.add("EvaluateDataType", (dataType) => {
  cy.get(commonlocators.evaluatedType)
    .should("be.visible")
    .contains(dataType);
});

Cypress.Commands.add("EvaluateCurrentValue", (currentValue) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(commonlocators.evaluatedCurrentValue)
    .should("be.visible")
    .contains(currentValue);
});

Cypress.Commands.add("PublishtheApp", () => {
  cy.server();
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  // Wait before publish
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.assertPageSave();

  // Stubbing window.open to open in the same tab
  cy.window().then((window) => {
    cy.stub(window, "open").callsFake((url) => {
      window.location.href = Cypress.config().baseUrl + url.substring(1);
      window.location.target = "_self";
    });
  });

  cy.get(homePage.publishButton).click();
  cy.wait("@publishApp");

  cy.url().should("include", "/pages");
  cy.log("pagename: " + localStorage.getItem("PageName"));
});

Cypress.Commands.add("getCodeMirror", () => {
  return cy
    .get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}");
});

Cypress.Commands.add("testCodeMirror", (value) => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .first()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .first()
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(".CodeMirror textarea")
        .first()
        .should("have.value", value);
    });
});

Cypress.Commands.add("updateComputedValue", (value) => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents != "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea")
        .first()
        .clear({
          force: true,
        });
    }
    cy.get(".CodeMirror textarea")
      .first()
      .type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("testCodeMirrorLast", (value) => {
  cy.get(".CodeMirror textarea")
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .last()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .last()
        .clear({ force: true })
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get(".CodeMirror textarea")
        .last()
        .should("have.value", value);
    });
});

Cypress.Commands.add("testJsontext", (endp, value, paste = true) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents != "") {
      cy.log("The field is empty");
      cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
        .first()
        .click({ force: true })
        .focused({ force: true })
        .clear({
          force: true,
        });
    }
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
      .first()
      .then((el) => {
        const input = cy.get(el);
        if (paste) {
          input.invoke("val", value);
        } else {
          input.type(value, {
            force: true,
            parseSpecialCharSequences: false,
          });
        }
      });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("toggleJsAndUpdate", (endp, value) => {
  cy.get(".CodeMirror textarea")
    .last()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents != "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea")
        .last()
        .clear({
          force: true,
        });
    }
    cy.get(".CodeMirror textarea")
      .last()
      .type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(200);
});

Cypress.Commands.add("assertControlVisibility", (endp, value) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror")
    .first()
    .should("not.be.visible");
});

Cypress.Commands.add("tableColumnDataValidation", (columnName) => {
  cy.get("[data-rbd-draggable-id='" + columnName + "'] input")
    .scrollIntoView()
    .first()
    .focus({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("tableColumnPopertyUpdate", (colId, newColName) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] input")
    .scrollIntoView()
    .should("be.visible")
    .click({
      force: true,
    });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input").clear({
    force: true,
  });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input").type(newColName, {
    force: true,
  });
  cy.get(".draggable-header ")
    .contains(newColName)
    .should("be.visible");
});

Cypress.Commands.add("hideColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("showColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  cy.get(".draggable-header ")
    .contains(colId)
    .should("be.visible");
});

Cypress.Commands.add("addColumn", (colId) => {
  cy.get(widgetsPage.addColumn).scrollIntoView();
  cy.get(widgetsPage.addColumn)
    .should("be.visible")
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.get(widgetsPage.defaultColName).clear({
    force: true,
  });
  cy.get(widgetsPage.defaultColName).type(colId, { force: true });
});

Cypress.Commands.add("editColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--edit-column-btn").click();
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1500);
});

Cypress.Commands.add(
  "readTabledataValidateCSS",
  (rowNum, colNum, cssProperty, cssValue) => {
    const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div`;
    cy.get(selector).should("have.css", cssProperty, cssValue);
  },
);

Cypress.Commands.add("readTextDataValidateCSS", (cssProperty, cssValue) => {
  cy.get(commonlocators.headingTextStyle).should(
    "have.css",
    cssProperty,
    cssValue,
  );
});

Cypress.Commands.add("evaluateErrorMessage", (value) => {
  cy.get(commonlocators.evaluateMsg)
    .first()
    .click()
    .invoke("text")
    .then((text) => {
      const someText = text;
      expect(someText).to.equal(value);
    });
});

Cypress.Commands.add("addAction", (value) => {
  cy.get(commonlocators.dropdownSelectButton)
    .last()
    .click();
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Show Message")
    .click();
  cy.enterActionValue(value);
});

Cypress.Commands.add("selectShowMsg", (value) => {
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Show Message")
    .click();
});

Cypress.Commands.add("addSuccessMessage", (value) => {
  cy.get(commonlocators.chooseMsgType)
    .last()
    .click();
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Success")
    .click();
  cy.enterActionValue(value);
});

Cypress.Commands.add("SetDateToToday", () => {
  cy.get(formWidgetsPage.datepickerFooterPublish)
    .contains("Today")
    .click({ force: true });
  cy.assertPageSave();
});

Cypress.Commands.add("enterActionValue", (value) => {
  cy.get(".CodeMirror textarea")
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .last()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .last()
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
    });
});

Cypress.Commands.add("enterNavigatePageName", (value) => {
  cy.get("ul.tree")
    .children()
    .first()
    .within(() => {
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("{ctrl}{shift}{downarrow}")
        .then(($cm) => {
          if ($cm.val() !== "") {
            cy.get(".CodeMirror textarea")
              .first()
              .clear({
                force: true,
              });
          }
          cy.get(".CodeMirror textarea")
            .first()
            .type(value, {
              force: true,
              parseSpecialCharSequences: false,
            });
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(200);
          cy.get(".CodeMirror textarea")
            .first()
            .should("have.value", value);
        });
      cy.root();
    });
});

Cypress.Commands.add("ClearDate", () => {
  cy.get(".t--property-control-defaultdate input").clear();
  cy.assertPageSave();
});

Cypress.Commands.add("ClearDateFooter", () => {
  cy.get(formWidgetsPage.datepickerFooterPublish)
    .contains("Clear")
    .click({ force: true });
  //cy.assertPageSave();
});

Cypress.Commands.add("DeleteModal", () => {
  cy.get(widgetsPage.textbuttonWidget).dblclick("topRight", { force: true });
  cy.get(widgetsPage.deleteWidget)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("Createpage", (Pagename) => {
  cy.get(pages.AddPage)
    .first()
    .click();
  cy.wait("@createPage").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.xpath(pages.popover)
    .last()
    .click({ force: true });
  cy.get(pages.editName).click({ force: true });
  cy.get(pages.editInput)
    .type(Pagename)
    .type("{Enter}");
  pageidcopy = Pagename;
  cy.get("#loading").should("not.exist");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("Deletepage", (Pagename) => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(".t--page-sidebar-" + Pagename + "");
  cy.get(
    ".t--page-sidebar-" +
      Pagename +
      ">.t--page-sidebar-menu-actions>.bp3-popover-target",
  ).click({ force: true });
  cy.get(pages.Menuaction).click({ force: true });
  cy.get(pages.Delete).click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("generateUUID", () => {
  const uuid = require("uuid");
  const id = uuid.v4();
  return id.split("-")[0];
});

Cypress.Commands.add("addDsl", (dsl) => {
  let currentURL;
  let pageid;
  let layoutId;
  cy.url().then((url) => {
    currentURL = url;
    const myRegexp = /pages(.*)/;
    const match = myRegexp.exec(currentURL);
    pageid = match[1].split("/")[1];
    cy.log(pageidcopy + "page id copy");
    cy.log(pageid + "page id");
    //Fetch the layout id
    cy.server();
    cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
      const respBody = JSON.stringify(response.body);
      layoutId = JSON.parse(respBody).data.layouts[0].id;
      // Dumping the DSL to the created page
      cy.request(
        "PUT",
        "api/v1/layouts/" + layoutId + "/pages/" + pageid,
        dsl,
      ).then((response) => {
        cy.log(response.body);
        expect(response.status).equal(200);
        cy.reload();
      });
    });
  });
});

Cypress.Commands.add("DeleteAppByApi", () => {
  let currentURL;
  let appId;
  cy.url().then((url) => {
    currentURL = url;
    const myRegexp = /applications(.*)/;
    const match = myRegexp.exec(currentURL);
    appId = match ? match[1].split("/")[1] : null;

    if (appId != null) {
      cy.log(appId + "appId");
      cy.request("DELETE", "api/v1/applications/" + appId);
    }
  });
});
Cypress.Commands.add("togglebar", (value) => {
  cy.get(value)
    .check({ force: true })
    .should("be.checked");
});
Cypress.Commands.add("radiovalue", (value, value2) => {
  cy.get(value)
    .click()
    .clear()
    .type(value2);
});
Cypress.Commands.add("optionValue", (value, value2) => {
  cy.get(value)
    .click()
    .clear()
    .type(value2);
});
Cypress.Commands.add("dropdownDynamic", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get("ul.bp3-menu")
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("dropdownDynamicUpdated", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(commonlocators.dropdownmenu)
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("selectTextSize", (text) => {
  cy.get(".t--dropdown-option")
    .first()
    .contains(text)
    .click({ force: true });
});

Cypress.Commands.add("getAlert", (alertcss) => {
  cy.get(commonlocators.dropdownSelectButton).click({ force: true });
  cy.get(widgetsPage.menubar)
    .contains("Show Alert")
    .click({ force: true })
    .should("have.text", "Show Alert");

  cy.get(alertcss)
    .click({ force: true })
    .type("{command}{A}{del}")
    .type("hello")
    .should("not.to.be.empty");
  cy.get(".t--open-dropdown-Select-type").click({ force: true });
  cy.get(".bp3-popover-content .bp3-menu li")
    .contains("Success")
    .click({ force: true });
});

Cypress.Commands.add("togglebar", (value) => {
  cy.get(value)
    .check({ force: true })
    .should("be.checked");
});
Cypress.Commands.add("togglebarDisable", (value) => {
  cy.get(value)
    .uncheck({ force: true })
    .should("not.checked");
});

Cypress.Commands.add(
  "getAlert",
  (alertcss, propertyControl = commonlocators.dropdownSelectButton) => {
    cy.get(propertyControl)
      .first()
      .click({ force: true });
    cy.get(widgetsPage.menubar)
      .contains("Show Message")
      .click({ force: true });

    cy.get(alertcss)
      .click({ force: true })
      .type("{command}{A}{del}")
      .type("hello")
      .should("not.to.be.empty");
    cy.get(".t--open-dropdown-Select-type").click({ force: true });
    cy.get(".bp3-popover-content .bp3-menu li")
      .contains("Success")
      .click({ force: true });
  },
);

Cypress.Commands.add("addQueryFromLightningMenu", (QueryName) => {
  cy.get(commonlocators.dropdownSelectButton)
    .first()
    .click({ force: true })
    .selectOnClickOption("Execute a DB Query")
    .selectOnClickOption(QueryName);
});

Cypress.Commands.add("addAPIFromLightningMenu", (ApiName) => {
  cy.get(commonlocators.dropdownSelectButton)
    .first()
    .click({ force: true })
    .selectOnClickOption("Call An API")
    .selectOnClickOption(ApiName);
});

Cypress.Commands.add("radioInput", (index, text) => {
  cy.get(widgetsPage.RadioInput)
    .eq(index)
    .click()
    .clear()
    .type(text);
});
Cypress.Commands.add("tabVerify", (index, text) => {
  cy.get(".t--property-control-tabs input")
    .eq(index)
    .click({ force: true })
    .clear()
    .type(text);
  cy.get(LayoutPage.tabWidget)
    .contains(text)
    .click({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("getPluginFormsAndCreateDatasource", () => {
  /*
  cy.wait("@getPluginForm").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait("@createDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
  */
});

Cypress.Commands.add("NavigateToApiEditor", () => {
  cy.get(explorer.addEntityAPI).click({ force: true });
});

Cypress.Commands.add("NavigateToWidgetsInExplorer", () => {
  cy.get(explorer.entityWidget).click({ force: true });
});

Cypress.Commands.add("NavigateToQueriesInExplorer", () => {
  cy.get(explorer.entityQuery).click({ force: true });
});

Cypress.Commands.add("testCreateApiButton", () => {
  cy.get(ApiEditor.createBlankApiCard).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("testSaveDeleteDatasource", () => {
  cy.get(".t--test-datasource").click();
  cy.wait("@testDatasource");
  /*
    .should("have.nested.property", "response.body.data.success", true)
    .debug();
  */
  cy.get(".t--save-datasource").click();
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.get(datasourceEditor.editDatasource).click();

  cy.get(".t--delete-datasource").click();
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("importCurl", () => {
  cy.get(ApiEditor.curlImportBtn).click({ force: true });
  cy.wait("@curlImport").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  cy.get(explorer.addDBQueryEntity)
    .last()
    .click({ force: true });
  cy.get(queryEditor.addDatasource).click();
});

Cypress.Commands.add("NavigateToQueryEditor", () => {
  cy.get(explorer.addDBQueryEntity).click({ force: true });
});

Cypress.Commands.add("testDatasource", () => {
  cy.get(".t--test-datasource").click();
  cy.wait("@testDatasource");
  /*
   .should(
    "have.nested.property",
    "response.body.data.success",
    true,
  );
  */
});

Cypress.Commands.add("saveDatasource", () => {
  cy.get(".t--save-datasource").click();
  cy.wait("@saveDatasource")
    .then((xhr) => {
      cy.log(JSON.stringify(xhr.response.body));
    })
    .should("have.nested.property", "response.body.responseMeta.status", 200);
});

Cypress.Commands.add("testSaveDatasource", () => {
  cy.saveDatasource();
  cy.get(datasourceEditor.editDatasource).click();
  cy.testDatasource();
});

Cypress.Commands.add("fillMongoDatasourceForm", () => {
  cy.get(datasourceEditor["host"]).type(datasourceFormData["mongo-host"]);
  //cy.get(datasourceEditor["port"]).type(datasourceFormData["mongo-port"]);
  cy.get(datasourceEditor["selConnectionType"]).click();
  cy.contains(datasourceFormData["connection-type"]).click();
  cy.get(datasourceEditor["defaultDatabaseName"]).type(
    datasourceFormData["mongo-defaultDatabaseName"],
  );

  cy.get(datasourceEditor.sectionAuthentication).click();
  cy.get(datasourceEditor["databaseName"])
    .clear()
    .type(datasourceFormData["mongo-databaseName"]);
  cy.get(datasourceEditor["username"]).type(
    datasourceFormData["mongo-username"],
  );
  cy.get(datasourceEditor["password"]).type(
    datasourceFormData["mongo-password"],
  );
  cy.get(datasourceEditor["authenticationAuthtype"]).click();
  cy.contains(datasourceFormData["mongo-authenticationAuthtype"]).click({
    force: true,
  });
});

Cypress.Commands.add("fillPostgresDatasourceForm", () => {
  cy.get(datasourceEditor.host).type(datasourceFormData["postgres-host"]);
  cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
  cy.get(datasourceEditor.databaseName)
    .clear()
    .type(datasourceFormData["postgres-databaseName"]);

  cy.get(datasourceEditor.sectionAuthentication).click();
  cy.get(datasourceEditor.username).type(
    datasourceFormData["postgres-username"],
  );
  cy.get(datasourceEditor.password).type(
    datasourceFormData["postgres-password"],
  );
});

Cypress.Commands.add("createPostgresDatasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.PostgreSQL).click();

  cy.getPluginFormsAndCreateDatasource();

  cy.fillPostgresDatasourceForm();

  cy.testSaveDatasource();
});

Cypress.Commands.add("deleteDatasource", (datasourceName) => {
  cy.NavigateToQueryEditor();

  cy.contains(".t--datasource-name", datasourceName)
    .find(".t--edit-datasource")
    .click();
  cy.get(".t--delete-datasource").click();
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("runQuery", () => {
  cy.get(queryEditor.runQuery).click({ force: true });
  cy.wait("@postExecute").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
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

Cypress.Commands.add("deleteQuery", () => {
  cy.hoverAndClick();
  cy.get(apiwidget.delete).click({ force: true });
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("deleteDataSource", () => {
  cy.hoverAndClick();
  cy.get(apiwidget.delete).click({ force: true });
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("runAndDeleteQuery", () => {
  cy.get(queryEditor.runQuery).click();
  cy.wait("@postExecute").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.get(queryEditor.deleteQuery).click();
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("dragAndDropToCanvas", (widgetType, { x, y }) => {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.get(selector)
    .trigger("mousedown", { button: 0 }, { force: true })
    .trigger("mousemove", x, y, { force: true });
  cy.get(explorer.dropHere)
    .trigger("mousemove", x, y)
    .trigger("mouseup", x, y + 20);
});

Cypress.Commands.add("executeDbQuery", (queryName) => {
  cy.get(widgetsPage.buttonOnClick)
    .get(commonlocators.dropdownSelectButton)
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains("Execute a DB Query")
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains(queryName)
    .click({ force: true });
});

Cypress.Commands.add("CreateMockQuery", (queryName) => {
  // cy.get(queryEditor.addNewQueryBtn).click({ force: true });
  cy.get(queryEditor.createQuery)
    .first()
    .click({ force: true });
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

Cypress.Commands.add("openPropertyPane", (widgetType) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.get(selector)
    .first()
    .trigger("mouseover", { force: true })
    .wait(500);
  cy.get(
    `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
  )
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("openPropertyPaneCopy", (widgetType) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.get(selector)
    .last()
    .trigger("mouseover", { force: true })
    .wait(500);
  cy.get(
    `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
  )
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("changeButtonStyle", (index, buttonColor, hoverColor) => {
  cy.get(widgetsPage.buttonStyleDropdown).click({ force: true });
  cy.get(
    ".bp3-popover-content .t--dropdown-option:nth-child(" + index + ")",
  ).click({ force: true });
  cy.PublishtheApp();
  cy.get(widgetsPage.widgetBtn).should(
    "have.css",
    "background-color",
    buttonColor,
  );
  // cy.get(buttonBackground)
  //   .first()
  //   .trigger('mouseover', { force: true });
  // cy.get(buttonBackground)
  //   .should('have.css', 'background-color', hoverColor);
  cy.wait(1000);
});

Cypress.Commands.add("closePropertyPane", () => {
  cy.get(commonlocators.editPropCrossButton).click({ force: true });
});

Cypress.Commands.add("onClickActions", (forSuccess, forFailure) => {
  // Filling the messages for success/failure in the onClickAction of the button widget.
  // For Success
  cy.get(".code-highlight")
    .children()
    .contains("No Action")
    .first()
    .click({ force: true })
    .selectOnClickOption("Show Message")
    .get("div.t--property-control-onclick div.CodeMirror-lines")
    .click()
    .type(forSuccess)
    .get("button.t--open-dropdown-Select-type")
    .click()
    .get("a.single-select div")
    .contains(forSuccess)
    .click();

  cy.wait(2000);
  // For Failure
  cy.get(".code-highlight")
    .children()
    .contains("No Action")
    .last()
    .click({ force: true })
    .selectOnClickOption("Show Message")
    .get("div.t--property-control-onclick div.CodeMirror-lines")
    .last()
    .click()
    .type(forFailure)
    .get("button.t--open-dropdown-Select-type")
    .last()
    .click()
    .get("a.single-select div")
    .contains(forFailure)
    .click();
});

Cypress.Commands.add("copyWidget", (widget, widgetLocator) => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  //Copy widget and verify all properties
  cy.get(widgetsPage.propertypaneText)
    .children()
    .last()
    .invoke("text")
    .then((originalWidget) => {
      cy.log(originalWidget);
      cy.get(widgetsPage.copyWidget).click();
      cy.reload();
      // Wait for the widget to be appear in the DOM and press Ctrl/Cmd + V to paste the button.
      cy.get(widgetLocator).should("be.visible");
      cy.get("body").type(`{${modifierKey}}v`);
      cy.wait(2000);
      cy.openPropertyPaneCopy(widget);
      cy.get(widgetsPage.propertypaneText)
        .children()
        .last()
        .invoke("text")
        .then((copiedWidget) => {
          cy.log(copiedWidget);
          expect(originalWidget).to.be.equal(copiedWidget);
        });
    });
});

Cypress.Commands.add("deleteWidget", (widget) => {
  // Delete the button widget
  cy.get(widgetsPage.removeWidget).click();
  cy.get(widgetsPage.deleteToast).should("have.text", "UNDO");
});

Cypress.Commands.add("UpdateChartType", (typeOfChart) => {
  // Command to change the chart type if the property pane of the chart widget is opened.
  cy.get(viewWidgetsPage.chartType)
    .last()
    .click({ force: true });
  cy.get(commonlocators.dropdownmenu)
    .children()
    .contains(typeOfChart)
    .click({ force: true });

  cy.get(viewWidgetsPage.chartType + " span.cs-text").should(
    "have.text",
    typeOfChart,
  );
});

Cypress.Commands.add("createAndFillApi", (url, parameters) => {
  cy.NavigateToApiEditor();
  cy.testCreateApiButton();
  cy.get("@createNewApi").then((response) => {
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    cy.expect(response.response.body.responseMeta.success).to.eq(true);
    cy.get(ApiEditor.ApiNameField)
      .click()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal(response.response.body.data.name);
      });
  });

  cy.get(ApiEditor.dataSourceField)
    .click({ force: true })
    .type(url, { parseSpecialCharSequences: false }, { force: true });
  cy.get(apiwidget.editResourceUrl)
    .first()
    .click({ force: true })
    .type(parameters, { parseSpecialCharSequences: false }, { force: true });
  cy.WaitAutoSave();
  cy.get(ApiEditor.formActionButtons).should("be.visible");
  cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
});

Cypress.Commands.add("isSelectRow", (index) => {
  cy.get(
    '.tbody .td[data-rowindex="' + index + '"][data-colindex="' + 0 + '"]',
  ).click({ force: true });
});

Cypress.Commands.add("readTabledata", (rowNum, colNum) => {
  // const selector = `.t--draggable-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const selector = `.tbody .td[data-rowindex="${rowNum}"][data-colindex="${colNum}"] div`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});

Cypress.Commands.add("getDate", (date, dateFormate) => {
  const eDate = Cypress.moment()
    .add(date, "days")
    .format(dateFormate);
  return eDate;
});

Cypress.Commands.add("setDate", (date, dateFormate) => {
  const expDate = Cypress.moment()
    .add(date, "days")
    .format(dateFormate);
  const sel = `.DayPicker-Day[aria-label=\"${expDate}\"]`;
  cy.get(sel).click();
});

Cypress.Commands.add("pageNo", (index) => {
  cy.get(".page-item")
    .first()
    .click({ force: true });
});

Cypress.Commands.add("pageNoValidate", (index) => {
  const data = '.e-numericcontainer a[index="' + index + '"]';
  const pageVal = cy.get(data);
  return pageVal;
});

Cypress.Commands.add("validateDisableWidget", (widgetCss, disableCss) => {
  cy.get(widgetCss + disableCss).should("exist");
});

Cypress.Commands.add("validateEnableWidget", (widgetCss, disableCss) => {
  cy.get(widgetCss + disableCss).should("not.exist");
});

Cypress.Commands.add("validateHTMLText", (widgetCss, htmlTag, value) => {
  cy.get(widgetCss + " iframe").then(($iframe) => {
    const $body = $iframe.contents().find("body");
    cy.wrap($body)
      .find(htmlTag)
      .should("have.text", value);
  });
});

Cypress.Commands.add("startRoutesForDatasource", () => {
  cy.server();
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
});

Cypress.Commands.add("startServerAndRoutes", () => {
  //To update route with intercept after working on alias wrt wait and alias
  cy.server();
  cy.route("GET", "/api/v1/applications/new").as("applications");
  cy.route("GET", "/api/v1/users/profile").as("getUser");
  cy.route("GET", "/api/v1/plugins").as("getPlugins");
  cy.route("POST", "/api/v1/logout").as("postLogout");

  cy.route("GET", "/api/v1/datasources?organizationId=*").as("getDataSources");
  cy.route("GET", "/api/v1/pages/application/*").as("getPagesForCreateApp");
  cy.route("GET", "/api/v1/applications/view/*").as("getPagesForViewApp");

  cy.route("POST");
  cy.route("GET", "/api/v1/pages/*").as("getPage");
  cy.route("GET", "/api/v1/applications/*/pages/*/edit").as("getAppPageEdit");
  cy.route("GET", "/api/v1/actions*").as("getActions");
  cy.route("GET", "api/v1/providers/categories").as("getCategories");
  cy.route("GET", "api/v1/import/templateCollections").as(
    "getTemplateCollections",
  );
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAPI");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApp");
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAction");
  cy.route("DELETE", "/api/v1/pages/*").as("deletePage");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");
  cy.route("GET", "/api/v1/datasources/*/structure?ignoreCache=*").as(
    "getDatasourceStructure",
  );

  cy.route("GET", "/api/v1/organizations").as("organizations");
  cy.route("GET", "/api/v1/organizations/*").as("getOrganisation");

  cy.route("POST", "/api/v1/actions/execute").as("executeAction");
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.route("POST", "/track/*").as("postTrack");
  cy.route("POST", "/api/v1/actions/execute").as("postExecute");
  cy.route("PUT", "/api/v1/actions/executeOnLoad/*").as("setExecuteOnLoad");

  cy.route("POST", "/api/v1/actions").as("createNewApi");
  cy.route("POST", "/api/v1/import?type=CURL&pageId=*&name=*").as("curlImport");
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAction");
  cy.route("GET", "/api/v1/marketplace/providers?category=*&page=*&size=*").as(
    "get3PProviders",
  );
  cy.route("GET", "/api/v1/marketplace/templates?providerId=*").as(
    "get3PProviderTemplates",
  );
  cy.route("POST", "/api/v1/items/addToPage").as("add3PApiToPage");

  cy.route("GET", "/api/v1/plugins/*/form").as("getPluginForm");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApplication");
  cy.route("POST", "/api/v1/applications/?orgId=*").as("createNewApplication");
  cy.route("PUT", "/api/v1/applications/*").as("updateApplication");
  cy.route("PUT", "/api/v1/actions/*").as("saveAction");
  cy.route("PUT", "/api/v1/actions/move").as("moveAction");

  cy.route("POST", "/api/v1/organizations").as("createOrg");
  cy.route("POST", "api/v1/applications/import/*").as("importNewApplication");
  cy.route("GET", "api/v1/applications/export/*").as("exportApplication");
  cy.route("GET", "/api/v1/organizations/roles?organizationId=*").as(
    "getRoles",
  );
  cy.route("GET", "/api/v1/users/me").as("getUser");
  cy.route("POST", "/api/v1/pages").as("createPage");
  cy.route("POST", "/api/v1/pages/clone/*").as("clonePage");
  cy.route("PUT", "/api/v1/applications/*/changeAccess").as("changeAccess");

  cy.route("PUT", "/api/v1/organizations/*").as("updateOrganization");
  cy.route("GET", "/api/v1/pages/view/application/*").as("viewApp");
  cy.route("POST", "/api/v1/organizations/*/logo").as("updateLogo");
  cy.route("DELETE", "/api/v1/organizations/*/logo").as("deleteLogo");
  cy.route("POST", "/api/v1/applications/*/fork/*").as("postForkAppOrg");
  cy.route("PUT", "/api/v1/users/leaveOrganization/*").as("leaveOrgApiCall");
});

Cypress.Commands.add("alertValidate", (text) => {
  cy.get(commonlocators.success)
    .should("be.visible")
    .and("have.text", text);
});

Cypress.Commands.add("ExportVerify", (togglecss, name) => {
  cy.togglebar(togglecss);
  cy.get(".t--draggable-tablewidget button")
    .invoke("attr", "aria-label")
    .should("contain", name);
  cy.togglebarDisable(togglecss);
});

Cypress.Commands.add("readTabledataPublish", (rowNum, colNum) => {
  // const selector = `.t--widget-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});

Cypress.Commands.add("scrollTabledataPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div`;
  const tabVal = cy
    .get(selector)
    .scrollIntoView()
    .invoke("text");
  return tabVal;
});

Cypress.Commands.add("readTableLinkPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] a`;
  const hrefVal = cy.get(selector).invoke("attr", "href");
  return hrefVal;
});

Cypress.Commands.add("assertEvaluatedValuePopup", (expectedType) => {
  cy.get(dynamicInputLocators.evaluatedValue)
    .should("be.visible")
    .children("p")
    .siblings("pre")
    .should("have.text", expectedType);
});

Cypress.Commands.add("validateToastMessage", (value) => {
  cy.get(commonlocators.toastMsg).should("have.text", value);
});

Cypress.Commands.add("NavigateToPaginationTab", () => {
  cy.get(ApiEditor.apiTab)
    .contains("Pagination")
    .click();
  cy.xpath(apiwidget.paginationWithUrl).click({ force: true });
});

Cypress.Commands.add("ValidateTableData", (value) => {
  // cy.isSelectRow(0);
  cy.readTabledata("0", "0").then((tabData) => {
    const tableData = tabData;
    expect(tableData).to.equal(value.toString());
  });
});

Cypress.Commands.add("ValidatePublishTableData", (value) => {
  cy.isSelectRow(0);
  cy.readTabledataPublish("0", "0").then((tabData) => {
    const tableData = tabData;
    expect(tableData).to.equal(value);
  });
});

Cypress.Commands.add("ValidatePaginateResponseUrlData", (runTestCss) => {
  cy.SearchEntityandOpen("Api2");
  cy.NavigateToPaginationTab();
  cy.RunAPI();
  cy.get(ApiEditor.apiPaginationNextTest).click();
  cy.wait("@postExecute");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(runTestCss).click();
  cy.wait("@postExecute");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(ApiEditor.formActionButtons).should("be.visible");
  cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
  cy.get(ApiEditor.responseBody)
    .contains("name")
    .siblings("span")
    .invoke("text")
    .then((tabData) => {
      const respBody = tabData.match(/"(.*)"/)[0];
      localStorage.setItem("respBody", respBody);
      cy.log(respBody);
      cy.SearchEntityandOpen("Table1");
      // cy.openPropertyPane("tablewidget");
      // cy.testJsontext("tabledata", "{{Api2.data.results}}");
      cy.isSelectRow(0);
      cy.readTabledata("0", "1").then((tabData) => {
        const tableData = tabData;
        expect(`\"${tableData}\"`).to.equal(respBody);
      });
    });
});

Cypress.Commands.add("ValidatePaginationInputData", () => {
  cy.isSelectRow(0);
  cy.readTabledataPublish("0", "1").then((tabData) => {
    const tableData = tabData;
    expect(`\"${tableData}\"`).to.equal(localStorage.getItem("respBody"));
  });
});

Cypress.Commands.add("callApi", (apiname) => {
  cy.get(commonlocators.callApi)
    .first()
    .click();
  cy.get(commonlocators.singleSelectMenuItem)
    .contains("Call An API")
    .click();
  cy.get(commonlocators.selectMenuItem)
    .contains(apiname)
    .click();
});

Cypress.Commands.add("assertPageSave", () => {
  cy.get(commonlocators.saveStatusSuccess);
});

Cypress.Commands.add("ValidateQueryParams", (param) => {
  cy.xpath(apiwidget.paramsTab)
    .should("be.visible")
    .click({ force: true });
  cy.xpath(apiwidget.paramKey)
    .first()
    .contains(param.key);
  cy.xpath(apiwidget.paramValue)
    .first()
    .contains(param.value);
});
