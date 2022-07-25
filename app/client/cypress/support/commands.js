/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* This file is used to maintain comman methods across tests , refer other *.js files for adding common methods */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
//require('cy-verify-downloads').addCustomCommand();
const path = require("path");

const dayjs = require("dayjs");
const {
  addMatchImageSnapshotCommand,
} = require("cypress-image-snapshot/command");
const loginPage = require("../locators/LoginPage.json");
const signupPage = require("../locators/SignupPage.json");
import homePage from "../locators/HomePage";
const pages = require("../locators/Pages.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
import ApiEditor from "../locators/ApiEditor";
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");
const viewWidgetsPage = require("../locators/ViewWidgets.json");
const generatePage = require("../locators/GeneratePage.json");
const jsEditorLocators = require("../locators/JSEditor.json");
const commonLocators = require("../locators/commonlocators.json");
import commentsLocators from "../locators/CommentsLocators";
const queryLocators = require("../locators/QueryEditor.json");
const welcomePage = require("../locators/welcomePage.json");
const publishWidgetspage = require("../locators/publishWidgetspage.json");
const themelocator = require("../locators/ThemeLocators.json");
import gitSyncLocators from "../locators/gitSyncLocators";

let pageidcopy = " ";
const GITHUB_API_BASE = "https://api.github.com";
const chainStart = Symbol();

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("goToEditFromPublish", () => {
  cy.url().then((url) => {
    const urlObject = new URL(url);
    if (!urlObject.pathname.includes("edit")) {
      urlObject.pathname = urlObject.pathname + "/edit";
      cy.visit(urlObject.toString());
    }
  });
});

Cypress.Commands.add(
  "dragTo",
  { prevSubject: "element" },
  (subject, targetEl) => {
    cy.wrap(subject).trigger("dragstart");
    cy.get(targetEl).trigger("drop");
  },
);

Cypress.Commands.add("downloadData", (filetype) => {
  cy.get(publishWidgetspage.downloadBtn).click({ force: true });

  cy.get(publishWidgetspage.downloadOption)
    .contains(filetype)
    .click({ force: true });
});

Cypress.Commands.add("validateDownload", (fileName) => {
  // const downloadedFilename = Cypress.config("downloadsFolder")
  //   .concat("/")
  //   .concat(fileName);
  // cy.readFile(downloadedFilename, "binary", {
  //   timeout: 15000,
  // }).should((buffer) => expect(buffer.length).to.be.gt(100));

  let downloadsFolder = Cypress.config("downloadsFolder");
  cy.log("downloadsFolder is:" + downloadsFolder);
  cy.readFile(path.join(downloadsFolder, fileName)).should("exist");
});

Cypress.Commands.add(
  "AddFilterWithOperator",
  (operator, option, condition, value) => {
    cy.get(publishWidgetspage.addFilter).click();
    cy.get(publishWidgetspage.operatorsDropdown).click({ force: true });
    cy.get(publishWidgetspage.attributeValue)
      .contains(operator)
      .click({ force: true });
    cy.get(publishWidgetspage.attributesDropdown)
      .last()
      .click({ force: true });
    cy.get(publishWidgetspage.attributeValue)
      .contains(option)
      .click({ force: true });
    cy.get(publishWidgetspage.conditionDropdown)
      .last()
      .click({ force: true });
    cy.get(publishWidgetspage.attributeValue)
      .contains(condition)
      .click({ force: true });
    cy.get(publishWidgetspage.inputValue)
      .last()
      .type(value);
  },
);

Cypress.Commands.add("stubPostHeaderReq", () => {
  cy.intercept("POST", "/api/v1/users/invite", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("mockPostInvite");
});

Cypress.Commands.add(
  "addOAuth2AuthorizationCodeDetails",
  (accessTokenUrl, clientId, clientSecret, authURL) => {
    cy.get(datasource.authType).click();
    cy.get(datasource.OAuth2).click();
    cy.get(datasource.grantType).click();
    cy.get(datasource.authorizationCode).click();
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
    cy.testSelfSignedCertificateSettingsInREST(true);
  },
);

Cypress.Commands.add(
  "addOAuth2ClientCredentialsDetails",
  (accessTokenUrl, clientId, clientSecret, scope) => {
    cy.get(datasource.authType).click();
    cy.get(datasource.OAuth2).click();
    cy.xpath("//span[text()='Client Credentials']").should("be.visible");
    cy.get(datasource.accessTokenUrl).type(accessTokenUrl);
    cy.get(datasource.clienID).type(clientId);
    cy.get(datasource.clientSecret).type(clientSecret);
    cy.get(datasource.scope).type(scope);
    cy.get(datasource.clientAuthentication).should("be.visible");
    cy.xpath("//span[text()='Send client credentials in body']").should(
      "be.visible",
    );
    cy.testSelfSignedCertificateSettingsInREST(true);
  },
);

Cypress.Commands.add("testSelfSignedCertificateSettingsInREST", (isOAuth2) => {
  cy.get(datasource.advancedSettings).click();
  cy.get(datasource.useCertInAuth).should("not.exist");
  cy.get(datasource.certificateDetails).should("not.exist");
  cy.TargetDropdownAndSelectOption(datasource.useSelfSignedCert, "Yes");
  if (isOAuth2) {
    cy.get(datasource.useCertInAuth).should("exist");
  } else {
    cy.get(datasource.useCertInAuth).should("not.exist");
  }
  cy.get(datasource.certificateDetails).should("exist");
  cy.TargetDropdownAndSelectOption(datasource.useSelfSignedCert, "No");
  cy.get(datasource.advancedSettings).click();
});

Cypress.Commands.add("addBasicProfileDetails", (username, password) => {
  cy.get(datasource.authType).click();
  cy.xpath(datasource.basic).click();
  cy.get(datasource.basicUsername).type(username);
  cy.get(datasource.basicPassword).type(password);
});

Cypress.Commands.add("DeleteApp", (appName) => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.wait("@workspaces").should(
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
  cy.wait(1000); //waiting for window to load
  cy.window()
    .its("store")
    .invoke("dispatch", { type: "LOGOUT_USER_INIT" });
  cy.wait("@postLogout");

  cy.visit("/user/login");
  cy.get(loginPage.username).should("be.visible");
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword, { log: false });
  cy.get(loginPage.submitBtn).click();
  cy.wait("@getMe");
  cy.wait(3000);
  cy.get(".t--applications-container .createnew").should("be.visible");
  cy.get(".t--applications-container .createnew").should("be.enabled");
  initLocalstorage();
});

Cypress.Commands.add("Signup", (uname, pword) => {
  cy.window()
    .its("store")
    .invoke("dispatch", { type: "LOGOUT_USER_INIT" });
  cy.wait("@postLogout");

  cy.visit("/user/signup");
  cy.get(signupPage.username).should("be.visible");
  cy.get(signupPage.username).type(uname);
  cy.get(signupPage.password).type(pword);
  cy.get(signupPage.submitBtn).click();
  cy.wait(1000);
  cy.get(signupPage.roleDropdown).click();
  cy.get(signupPage.dropdownOption).click();
  cy.get(signupPage.useCaseDropdown).click();
  cy.get(signupPage.dropdownOption).click();
  cy.get(signupPage.roleUsecaseSubmit).click();

  cy.wait("@getMe");
  cy.wait(3000);
  initLocalstorage();
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
    //cy.log(response.body);
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
  cy.get(pages.deletePageConfirm)
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
  cy.wait(3000);
  cy.get(".t--applications-container .createnew").should("be.visible");
  cy.get(".t--applications-container .createnew").should("be.enabled");
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
  cy.get(commonlocators.searchEntityInExplorer)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.get(".t--entity-name").click({ multiple: true });
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(
    commonlocators.entitySearchResult.concat(apiname2).concat("')"),
  ).should("not.exist");
});

Cypress.Commands.add("GlobalSearchEntity", (apiname1, dontAssertVisibility) => {
  // entity explorer search will be hidden
  cy.get(commonlocators.searchEntityInExplorer)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.CheckAndUnfoldWidgets();
  cy.wait(500);
  if (!dontAssertVisibility) {
    cy.get(
      commonlocators.entitySearchResult.concat(apiname1).concat("')"),
    ).should("be.visible");
  }
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
    const subString = text.slice(0, -1);
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

Cypress.Commands.add("CheckAndUnfoldWidgets", () => {
  cy.get(commonlocators.widgetSection)
    .invoke("attr", "name")
    .then((name) => {
      if (name === "arrow-right") {
        cy.get(commonlocators.widgetSection).click({ force: true });
      }
    });
});

Cypress.Commands.add("SearchEntityandOpen", (apiname1) => {
  cy.get(commonlocators.searchEntityInExplorer)
    .clear({ force: true })
    .type(apiname1, { force: true });
  cy.CheckAndUnfoldWidgets();
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).scrollIntoView({ easing: "linear" });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .last()
    .click({ force: true });
  //cy.get('.t--entity-name').click({multiple:true})
});

Cypress.Commands.add("SearchEntityAndUnfold", (apiname1) => {
  cy.get(commonlocators.searchEntityInExplorer)
    .clear({ force: true })
    .type(apiname1, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.CheckAndUnfoldWidgets();
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .parents(commonlocators.entityItem)
    .first()
    .children(commonlocators.entityCollapseToggle)
    .last()
    .click({ force: true });
});

Cypress.Commands.add("OpenBindings", (apiname1) => {
  cy.wait(500);
  cy.get(commonlocators.searchEntityInExplorer)
    .clear({ force: true })
    .type(apiname1, { force: true });
  cy.CheckAndUnfoldWidgets();
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .parents(commonlocators.entityItem)
    .first()
    .trigger("mouseover")
    .find(commonlocators.entityContextMenu)
    .last()
    .click({ force: true });
  cy.get(commonlocators.entityContextMenuContent)
    .children("li")
    .contains("Show Bindings")
    .click({ force: true });
});

Cypress.Commands.add("SearchEntityandDblClick", (apiname1) => {
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  return cy
    .get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .dblclick()
    .get("input[type=text]")
    .last();
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

Cypress.Commands.add("EvaluateCurrentValue", (currentValue) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.get(commonlocators.evaluatedCurrentValue)
    .first()
    .should("be.visible")
    .should("not.have.text", "undefined");
  cy.get(commonlocators.evaluatedCurrentValue)
    .first()
    //.should("be.visible")
    .click({ force: true })
    .then(($text) => {
      if ($text.text()) expect($text.text()).to.eq(currentValue);
    });
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
  cy.log("pagename: " + localStorage.getItem("PageName"));
  cy.wait(1000); //wait time for page to load!
});

Cypress.Commands.add("tabPopertyUpdate", (tabId, newTabName) => {
  cy.get("[data-rbd-draggable-id='" + tabId + "'] input")
    .scrollIntoView()
    .should("be.visible")
    .click({
      force: true,
    });
  cy.get("[data-rbd-draggable-id='" + tabId + "'] input").clear({
    force: true,
  });
  cy.get("[data-rbd-draggable-id='" + tabId + "'] input").type(newTabName, {
    force: true,
  });
  cy.get(`.t--tabid-${tabId}`)
    .contains(newTabName)
    .should("be.visible");
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
    pageid = currentURL
      .split("/")[5]
      ?.split("-")
      .pop();
    cy.log(pageidcopy + "page id copy");
    cy.log(pageid + "page id");
    //Fetch the layout id
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
  const appId = localStorage.getItem("applicationId");
  if (appId !== null) {
    cy.log(appId + "appId");
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + appId,
      failOnStatusCode: false,
    }).then((response) => {
      cy.log(response.body);
      cy.log(response.status);
    });
  }
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

Cypress.Commands.add("typeIntoDraftEditor", (selector, text) => {
  cy.get(selector).then((input) => {
    var textarea = input.get(0);
    textarea.dispatchEvent(new Event("focus"));

    var textEvent = document.createEvent("TextEvent");
    textEvent.initTextEvent("textInput", true, true, null, text);
    textarea.dispatchEvent(textEvent);

    textarea.dispatchEvent(new Event("blur"));
  });
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

Cypress.Commands.add("NavigateToWidgetsInExplorer", () => {
  cy.get(explorer.entityWidget).click({ force: true });
});

Cypress.Commands.add("NavigateToJSEditor", () => {
  cy.get(explorer.createNew).click({ force: true });
  cy.get(".t--file-operation")
    .eq(1)
    .click({ force: true });
});

Cypress.Commands.add("importCurl", () => {
  cy.get(ApiEditor.curlImportBtn).click({ force: true });
  cy.wait("@curlImport").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("NavigateToActiveTab", () => {
  cy.get(explorer.activeTab).click({ force: true });

  // cy.get(pages.integrationActiveTab)
  //   .should("be.visible")
  //   .click({ force: true });
});

Cypress.Commands.add("selectAction", (option) => {
  cy.get(".single-select")
    .contains(option)
    .click({ force: true });
});

Cypress.Commands.add("deleteActionAndConfirm", () => {
  cy.selectAction("Delete");
  cy.selectAction("Are you sure?");
});

Cypress.Commands.add("deleteJSObject", () => {
  cy.hoverAndClick();
  cy.get(jsEditorLocators.delete).click({ force: true });
  cy.get(jsEditorLocators.deleteConfirm).click({ force: true });
  cy.wait("@deleteJSCollection").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("deleteDataSource", () => {
  cy.hoverAndClick();
  cy.get(apiwidget.delete).click({ force: true });
  cy.get(apiwidget.deleteConfirm).click({ force: true });
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("dragAndDropToCanvas", (widgetType, { x, y }) => {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector)
    .trigger("dragstart", { force: true })
    .trigger("mousemove", x, y, { force: true });
  cy.get(explorer.dropHere)
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
  cy.assertPageSave();
});

Cypress.Commands.add(
  "dragAndDropToWidget",
  (widgetType, destinationWidget, { x, y }) => {
    const selector = `.t--widget-card-draggable-${widgetType}`;
    cy.wait(800);
    cy.get(selector)
      .scrollIntoView()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    const selector2 = `.t--draggable-${destinationWidget}`;
    cy.get(selector2)
      .scrollIntoView()
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
  },
);

Cypress.Commands.add("changeButtonColor", (buttonColor) => {
  cy.get(widgetsPage.buttonColor)
    .click({ force: true })
    .clear()
    .type(buttonColor);
  cy.PublishtheApp();
  cy.get(widgetsPage.widgetBtn).should(
    "have.css",
    "background-color",
    buttonColor,
  );
  cy.wait(1000);
});

Cypress.Commands.add("closePropertyPane", () => {
  cy.get(commonlocators.canvas).click({ force: true });
});

Cypress.Commands.add("onClickActions", (forSuccess, forFailure, endp) => {
  cy.EnableAllCodeEditors();
  // Filling the messages for success/failure in the onClickAction of the button widget.
  // For Success
  cy.get(".code-highlight", { timeout: 10000 })
    .children()
    .contains("No action")
    .first()
    .click({ force: true })
    .selectOnClickOption("Show message")
    .get("div.t--property-control-" + endp + " div.CodeMirror-lines")
    .click()
    .type(forSuccess)
    .get("button.t--open-dropdown-Select-type")
    .first()
    .click({ force: true })
    .selectOnClickOption(forSuccess);

  cy.wait(2000);
  // For Failure
  cy.get(".code-highlight")
    .children()
    .contains("No action")
    .last()
    .click({ force: true })
    .selectOnClickOption("Show message")
    .wait(2000)
    .get("div.t--property-control-" + endp + " div.CodeMirror-lines")
    .last()
    .click()
    .type(forFailure)
    .get("button.t--open-dropdown-Select-type")
    .last()
    .click({ force: true })
    .selectOnClickOption(forFailure);
});

Cypress.Commands.add("isSelectRow", (index) => {
  cy.get('.tbody .td[data-rowindex="' + index + '"][data-colindex="' + 0 + '"]')
    .first()
    .click({ force: true });
  cy.wait(500); //for selection to show!
});

Cypress.Commands.add("getDate", (date, dateFormate) => {
  const eDate = dayjs()
    .add(date, "days")
    .format(dateFormate);
  return eDate;
});

Cypress.Commands.add("setDate", (date, dateFormate) => {
  const expDate = dayjs()
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

Cypress.Commands.add("validateToolbarVisible", (widgetCss, toolbarCss) => {
  cy.get(widgetCss + toolbarCss).should("exist");
});

Cypress.Commands.add("validateToolbarHidden", (widgetCss, toolbarCss) => {
  cy.get(widgetCss + toolbarCss).should("not.exist");
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
Cypress.Commands.add("setTinyMceContent", (tinyMceId, content) => {
  cy.window().then((win) => {
    const editor = win.tinymce.editors[tinyMceId];
    editor.setContent(content);
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
  cy.route("PUT", "/api/v1/themes/applications/*").as("updateTheme");
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("GET", "/api/v1/applications/new").as("applications");
  cy.route("GET", "/api/v1/users/profile").as("getUser");
  cy.route("GET", "/api/v1/plugins").as("getPlugins");
  cy.route("POST", "/api/v1/logout").as("postLogout");

  cy.route("GET", "/api/v1/datasources?workspaceId=*").as("getDataSources");
  cy.route("GET", "/api/v1/pages?*mode=EDIT").as("getPagesForCreateApp");
  cy.route("GET", "/api/v1/pages?*mode=PUBLISHED").as("getPagesForViewApp");

  cy.route("POST");
  cy.route("GET", "/api/v1/pages/*").as("getPage");
  cy.route("GET", "/api/v1/applications/*/pages/*/edit").as("getAppPageEdit");
  cy.route("GET", "/api/v1/actions*").as("getActions");
  cy.route("GET", "api/v1/providers/categories").as("getCategories");
  cy.route("GET", "api/v1/import/templateCollections").as(
    "getTemplateCollections",
  );
  cy.route("PUT", "/api/v1/pages/*").as("updatePage");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApp");
  cy.route("DELETE", "/api/v1/pages/*").as("deletePage");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");
  cy.route("GET", "/api/v1/datasources/*/structure?ignoreCache=*").as(
    "getDatasourceStructure",
  );
  cy.route("PUT", "/api/v1/datasources/datasource-query/*").as(
    "datasourceQuery",
  );

  cy.route("POST", "/api/v1/datasources/*/trigger").as("trigger");

  cy.route("PUT", "/api/v1/pages/crud-page/*").as("replaceLayoutWithCRUDPage");
  cy.route("POST", "/api/v1/pages/crud-page").as("generateCRUDPage");

  cy.route("GET", "/api/v1/workspaces").as("workspaces");
  cy.route("GET", "/api/v1/workspaces/*").as("getWorkspace");

  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.route("POST", "/track/*").as("postTrack");
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
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApplication");
  cy.route("POST", "/api/v1/applications?workspaceId=*").as(
    "createNewApplication",
  );
  cy.route("PUT", "/api/v1/applications/*").as("updateApplication");
  cy.route("PUT", "/api/v1/actions/*").as("saveAction");
  cy.route("PUT", "/api/v1/actions/move").as("moveAction");

  cy.route("POST", "/api/v1/workspaces").as("createWorkspace");
  cy.route("POST", "api/v1/applications/import/*").as("importNewApplication");
  cy.route("GET", "api/v1/applications/export/*").as("exportApplication");
  cy.route("GET", "/api/v1/workspaces/roles?workspaceId=*").as("getRoles");
  cy.route("GET", "/api/v1/users/me").as("getMe");
  cy.route("POST", "/api/v1/pages").as("createPage");
  cy.route("POST", "/api/v1/pages/clone/*").as("clonePage");
  cy.route("POST", "/api/v1/applications/clone/*").as("cloneApp");
  cy.route("PUT", "/api/v1/applications/*/changeAccess").as("changeAccess");

  cy.route("PUT", "/api/v1/workspaces/*").as("updateWorkspace");
  cy.route("GET", "/api/v1/pages/view/application/*").as("viewApp");
  cy.route("GET", "/api/v1/pages/*/view?*").as("viewPage");
  cy.route("POST", "/api/v1/workspaces/*/logo").as("updateLogo");
  cy.route("DELETE", "/api/v1/workspaces/*/logo").as("deleteLogo");
  cy.route("POST", "/api/v1/applications/*/fork/*").as("postForkAppWorkspace");
  cy.route("PUT", "/api/v1/users/leaveWorkspace/*").as("leaveWorkspaceApiCall");
  cy.route("DELETE", "api/v1/workspaces/*").as("deleteWorkspaceApiCall");

  cy.route("POST", "/api/v1/comments/threads").as("createNewThread");
  cy.route("POST", "/api/v1/comments?threadId=*").as("createNewComment");

  cy.route("POST", "api/v1/git/connect/app/*").as("connectGitRepo");
  cy.route("POST", "api/v1/git/commit/app/*").as("commit");
  cy.route("POST", "/api/v1/git/import/*").as("importFromGit");
  cy.route("POST", "/api/v1/git/merge/app/*").as("mergeBranch");
  cy.route("POST", "/api/v1/git/merge/status/app/*").as("mergeStatus");
  cy.route("PUT", "api/v1/collections/actions/refactor").as("renameJsAction");

  cy.route("POST", "/api/v1/collections/actions").as("createNewJSCollection");
  cy.route("DELETE", "/api/v1/collections/actions/*").as("deleteJSCollection");
  cy.route("POST", "/api/v1/pages/crud-page").as("replaceLayoutWithCRUDPage");

  cy.intercept("POST", "/api/v1/users/super").as("createSuperUser");
  cy.intercept("POST", "/api/v1/actions/execute").as("postExecute");
  cy.intercept("GET", "/api/v1/admin/env").as("getEnvVariables");
  cy.intercept("DELETE", "/api/v1/git/branch/app/*").as("deleteBranch");
  cy.intercept("GET", "/api/v1/git/status/app/*").as("gitStatus");
  cy.intercept("PUT", "/api/v1/layouts/refactor").as("updateWidgetName");
  cy.intercept("GET", "/api/v1/workspaces/*/members").as("getMembers");
});

Cypress.Commands.add("startErrorRoutes", () => {
  cy.intercept("POST", "/api/v1/actions/execute", { statusCode: 500 }).as(
    "postExecuteError",
  );
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

Cypress.Commands.add("ValidateTableV2Data", (value) => {
  // cy.isSelectRow(0);
  cy.readTableV2data("0", "0").then((tabData) => {
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

Cypress.Commands.add("ValidatePublishTableV2Data", (value) => {
  cy.isSelectRow(0);
  cy.readTableV2dataPublish("0", "0").then((tabData) => {
    const tableData = tabData;
    expect(tableData).to.equal(value);
  });
});

Cypress.Commands.add("ValidatePaginateResponseUrlData", (runTestCss) => {
  cy.CheckAndUnfoldEntityItem("QUERIES/JS");
  cy.get(".t--entity-name")
    .contains("Api2")
    .click({ force: true });
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
      cy.get(".t--entity-name")
        .contains("Table1")
        .click({ force: true });
      cy.isSelectRow(0);
      cy.readTabledata("0", "1").then((tabData) => {
        const tableData = tabData;
        expect(`\"${tableData}\"`).to.equal(respBody);
      });
    });
});

Cypress.Commands.add("ValidatePaginateResponseUrlDataV2", (runTestCss) => {
  cy.CheckAndUnfoldEntityItem("QUERIES/JS");
  cy.get(".t--entity-name")
    .contains("Api2")
    .click({ force: true });
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
      cy.get(".t--entity-name")
        .contains("Table1")
        .click({ force: true });
      cy.isSelectRow(0);
      cy.readTableV2data("0", "1").then((tabData) => {
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

Cypress.Commands.add("ValidatePaginationInputDataV2", () => {
  cy.isSelectRow(0);
  cy.readTableV2dataPublish("0", "1").then((tabData) => {
    const tableData = tabData;
    expect(`\"${tableData}\"`).to.equal(localStorage.getItem("respBody"));
  });
});

Cypress.Commands.add("assertPageSave", () => {
  cy.get(commonlocators.saveStatusSuccess).should("exist");
});

Cypress.Commands.add(
  "validateCodeEditorContent",
  (selector, contentToValidate) => {
    cy.get(selector).within(() => {
      cy.get(".CodeMirror-code").should("have.text", contentToValidate);
    });
  },
);

Cypress.Commands.add("skipGenerateCRUDPage", () => {
  cy.get(generatePage.buildFromScratchActionCard).click();
});

Cypress.Commands.add("updateMapType", (mapType) => {
  // Command to change the map chart type if the property pane of the map chart widget is opened.
  cy.get(viewWidgetsPage.mapType)
    .last()
    .click({ force: true });
  cy.get(commonlocators.dropdownmenu)
    .children()
    .contains(mapType)
    .click({ force: true });

  cy.get(viewWidgetsPage.mapType + " span.cs-text").should(
    "have.text",
    mapType,
  );
});

Cypress.Commands.add("createJSObject", (JSCode) => {
  cy.NavigateToJSEditor();
  cy.wait(1000);
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{downarrow}{downarrow}{downarrow}{downarrow}  ")
    .type(JSCode);
  cy.wait(1000);
  cy.get(jsEditorLocators.runButton)
    .first()
    .click();
});

Cypress.Commands.add("createSuperUser", () => {
  cy.wait(1000);
  cy.get(welcomePage.getStarted).should("be.visible");
  cy.get(welcomePage.getStarted).should("not.be.disabled");
  cy.get(welcomePage.getStarted).click();
  cy.get(welcomePage.fullName).should("be.visible");
  cy.get(welcomePage.email).should("be.visible");
  cy.get(welcomePage.password).should("be.visible");
  cy.get(welcomePage.verifyPassword).should("be.visible");
  cy.get(welcomePage.roleDropdown).should("be.visible");
  cy.get(welcomePage.useCaseDropdown).should("be.visible");
  cy.get(welcomePage.nextButton).should("be.disabled");

  cy.get(welcomePage.fullName).type(Cypress.env("USERNAME"));
  cy.get(welcomePage.nextButton).should("be.disabled");
  cy.get(welcomePage.email).type(Cypress.env("USERNAME"));
  cy.get(welcomePage.nextButton).should("be.disabled");
  cy.get(welcomePage.password).type(Cypress.env("PASSWORD"));
  cy.get(welcomePage.nextButton).should("be.disabled");
  cy.get(welcomePage.verifyPassword).type(Cypress.env("PASSWORD"));
  cy.get(welcomePage.nextButton).should("be.disabled");
  cy.get(welcomePage.roleDropdown).click();
  cy.get(welcomePage.roleDropdownOption)
    .eq(1)
    .click();
  cy.get(welcomePage.nextButton).should("be.disabled");
  cy.get(welcomePage.useCaseDropdown).click();
  cy.get(welcomePage.useCaseDropdownOption)
    .eq(1)
    .click();
  cy.get(welcomePage.nextButton).should("not.be.disabled");
  cy.get(welcomePage.nextButton).click();
  cy.get(welcomePage.newsLetter).should("be.visible");
  cy.get(welcomePage.dataCollection).should("be.visible");
  cy.get(welcomePage.dataCollection)
    .trigger("mouseover")
    .click();
  cy.get(welcomePage.newsLetter)
    .trigger("mouseover")
    .click();
  cy.get(welcomePage.createButton).should("be.visible");
  cy.get(welcomePage.createButton).click();
  cy.wait("@createSuperUser").then((interception) => {
    expect(interception.request.body).not.contains(
      "allowCollectingAnonymousData=true",
    );
    expect(interception.request.body).not.contains("signupForNewsletter=true");
  });
  cy.LogOut();
  cy.wait(2000);
});

Cypress.Commands.add("SignupFromAPI", (uname, pword) => {
  cy.request({
    method: "POST",
    url: "api/v1/users",
    headers: {
      "content-type": "application/json",
    },
    followRedirect: false,
    form: true,
    body: {
      name: uname,
      email: uname,
      password: pword,
    },
  }).then((response) => {
    expect(response.status).equal(302);
    cy.log(response.body);
  });
});

//Generate CRUD page methods: <Aishwarya>

Cypress.Commands.add("startInterceptRoutesForMySQL", () => {
  //All stubbing - updating app id to current app id for Delete app by api call to be successfull:

  cy.replaceApplicationIdForInterceptPages(
    "cypress/fixtures/mySQL_PUT_replaceLayoutWithCRUD.json",
  );

  cy.intercept("POST", "/api/v1/datasources/test", {
    fixture: "testAction.json",
  }).as("testDatasource");
  cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*", {
    fixture: "mySQL_GET_selectTableDropdown.json",
  }).as("getDatasourceStructure");
  cy.intercept("PUT", "/api/v1/pages/crud-page/*", {
    fixture: "mySQL_PUT_replaceLayoutWithCRUD.json",
  }).as("replaceLayoutWithCRUDPage");
  cy.intercept("GET", "/api/v1/actions*", {
    fixture: "mySQL_GET_Actions.json",
  }).as("getActions");
  cy.intercept("POST", "/api/v1/actions/execute", {
    fixture: "mySQL_POST_Execute.json",
  }).as("postExecute");
  cy.intercept("POST", "/api/v1/pages/crud-page", {
    fixture: "mySQL_PUT_replaceLayoutWithCRUD.json",
  }).as("replaceLayoutWithCRUDPage");
});

Cypress.Commands.add("startInterceptRoutesForMongo", () => {
  //All stubbing
  cy.replaceApplicationIdForInterceptPages(
    "cypress/fixtures/mongo_PUT_replaceLayoutWithCRUD.json",
  );

  cy.intercept("POST", "/api/v1/datasources/test", {
    fixture: "testAction.json",
  }).as("testDatasource");
  cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*", {
    fixture: "mongo_GET_selectTableDropdown.json",
  }).as("getDatasourceStructure");
  cy.intercept("PUT", "/api/v1/pages/crud-page/*", {
    fixture: "mongo_PUT_replaceLayoutWithCRUD.json",
  }).as("replaceLayoutWithCRUDPage");
  cy.intercept("GET", "/api/v1/actions*", {
    fixture: "mongo_GET_Actions.json",
  }).as("getActions");
  cy.intercept("POST", "/api/v1/actions/execute", {
    fixture: "mongo_POST_Actions.json",
  }).as("postExecute");
  cy.intercept("POST", "/api/v1/pages/crud-page", {
    fixture: "mongo_PUT_replaceLayoutWithCRUD.json",
  }).as("post_replaceLayoutCRUDStub");
});

Cypress.Commands.add("startInterceptRoutesForS3", () => {
  cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.intercept("PUT", "/api/v1/datasources/datasource-query/*").as(
    "put_datasources",
  );
  cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*").as(
    "getDatasourceStructure",
  );
  cy.intercept("PUT", "/api/v1/pages/crud-page/*").as("put_replaceLayoutCRUD");
  cy.intercept("POST", "/api/v1/pages/crud-page").as("post_replaceLayoutCRUD");
  cy.intercept("GET", "/api/v1/actions*").as("get_Actions");
  cy.intercept("POST", "/api/v1/actions/execute").as("post_Execute");
});

Cypress.Commands.add("replaceApplicationIdForInterceptPages", (fixtureFile) => {
  let currentAppId, currentURL;
  cy.readFile(fixtureFile, (err, data) => {
    if (err) {
      return console.error(err);
    }
  }).then((data) => {
    cy.url().then((url) => {
      currentURL = url;
      const myRegexp = /applications(.*)/;
      const match = myRegexp.exec(currentURL);
      cy.log(currentURL + "currentURL from intercept is");
      currentAppId = match ? match[1].split("/")[1] : null;
      data.data.page.applicationId = currentAppId;
      cy.writeFile(fixtureFile, JSON.stringify(data));
    });
  });
});

Cypress.Commands.add("skipCommentsOnboarding", () => {
  cy.get(commonLocators.canvas);
  cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
  cy.contains("SKIP").click({ force: true });
  cy.get("input[name='displayName']").type("Skip User");
  cy.get("button[type='submit']").click();
});

Cypress.Commands.add(
  "paste",
  { prevSubject: true },
  (selector, pastePayload) => {
    cy.wrap(selector).then(($destination) => {
      const pasteEvent = Object.assign(
        new Event("paste", { bubbles: true, cancelable: true }),
        {
          clipboardData: {
            getData: () => pastePayload,
          },
        },
      );
      $destination[0].dispatchEvent(pasteEvent);
    });
  },
);

// the way we target form controls from now on has to change
// we would be getting the form controls by their class names and not their xpaths.
// the xpath method is flaky and highly subjected to change.
Cypress.Commands.add("typeValueNValidate", (valueToType, fieldName = "") => {
  if (fieldName) {
    cy.get(fieldName).then(($field) => {
      cy.updateCodeInput($field, valueToType);
    });
  } else {
    cy.xpath("//div[@class='CodeEditorTarget']").then(($field) => {
      cy.updateCodeInput($field, valueToType);
    });
  }
  cy.EvaluateCurrentValue(valueToType);
  // cy.xpath("//p[text()='" + fieldName + "']/following-sibling::div//div[@class='CodeMirror-code']//span/span").should((fieldValue) => {
  //   textF = fieldValue.innerText
  //   fieldValue.innerText = ""
  // }).then(() => {
  //   cy.log("current field value is : '" + textF + "'")
  // })
});

Cypress.Commands.add("clickButton", (btnVisibleText) => {
  cy.xpath("//span[text()='" + btnVisibleText + "']/parent::button")
    .first()
    .scrollIntoView()
    .click({ force: true });
});

Cypress.Commands.add(
  "actionContextMenuByEntityName",
  (entityNameinLeftSidebar, action = "Delete", subAction) => {
    cy.wait(2000);
    // cy.get(
    //   commonlocators.entitySearchResult
    //     .concat(entityNameinLeftSidebar)
    //     .concat("')"),
    // )
    //   .parents(commonlocators.entityItem)
    //   .first()
    //   .trigger("mouseover")
    //   .find(commonlocators.entityContextMenu)
    //   .last()
    //   .click({ force: true });

    cy.xpath(
      "//div[text()='" +
        entityNameinLeftSidebar +
        "']/ancestor::div[1]/following-sibling::div//div[contains(@class, 'entity-context-menu-icon')]",
    )
      .last()
      .click({ force: true });

    cy.xpath(
      "//div[text()='" +
        action +
        "']/ancestor::a[contains(@class, 'single-select')]",
    )
      .click({ force: true })
      .wait(500);

    if (subAction) {
      cy.xpath(
        "//div[text()='" +
          subAction +
          "']/parent::a[contains(@class, 'single-select')]",
      )
        .click({ force: true })
        .wait(500);
    }

    if (action === "Delete")
      cy.xpath("//div[text()='" + entityNameinLeftSidebar + "']").should(
        "not.exist",
      );
  },
);

Cypress.Commands.add("selectEntityByName", (entityNameinLeftSidebar) => {
  cy.xpath(
    "//div[contains(@class, 't--entity-name')][text()='" +
      entityNameinLeftSidebar +
      "']",
  )
    .last()
    .click({ force: true })
    .wait(2000);
});

Cypress.Commands.add(
  "EvaluatFieldValue",
  (fieldName = "", currentValue = "") => {
    let toValidate = false;
    if (currentValue) toValidate = true;
    if (fieldName) {
      cy.get(fieldName).click();
    } else {
      cy.xpath("//div[@class='CodeMirror-code']")
        .first()
        .click();
    }
    cy.wait(3000); //Increasing wait time to evaluate non-undefined values
    const val = cy
      .get(commonlocators.evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .invoke("text");
    if (toValidate) expect(val).to.eq(currentValue);
    return val;
  },
);

// Cypress >=8.3.x  onwards
cy.all = function(...commands) {
  const _ = Cypress._;
  // eslint-disable-next-line
  const chain = cy.wrap(null, { log: false });
  const stopCommand = _.find(cy.queue.get(), {
    attributes: { chainerId: chain.chainerId },
  });
  const startCommand = _.find(cy.queue.get(), {
    attributes: { chainerId: commands[0].chainerId },
  });
  const p = chain.then(() => {
    return _(commands)
      .map((cmd) => {
        return cmd[chainStart]
          ? cmd[chainStart].attributes
          : _.find(cy.queue.get(), {
              attributes: { chainerId: cmd.chainerId },
            }).attributes;
      })
      .concat(stopCommand.attributes)
      .slice(1)
      .flatMap((cmd) => {
        return cmd.prev.get("subject");
      })
      .value();
  });
  p[chainStart] = startCommand;
  return p;
};

Cypress.Commands.add("renameWithInPane", (renameVal) => {
  cy.get(apiwidget.ApiName).click({ force: true });
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(renameVal, { force: true })
    .should("have.value", renameVal)
    .blur();
});

Cypress.Commands.add("getEntityName", () => {
  let entityName = cy.get(apiwidget.ApiName).invoke("text");
  return entityName;
});

Cypress.Commands.add("VerifyErrorMsgAbsence", (errorMsgToVerifyAbsence) => {
  // Give this element 10 seconds to appear
  //cy.wait(10000)
  cy.xpath(
    "//div[@class='Toastify']//span[contains(text(),'" +
      errorMsgToVerifyAbsence +
      "')]",
    { timeout: 0 },
  ).should("not.exist");
});

Cypress.Commands.add("setQueryTimeout", (timeout) => {
  cy.get(queryLocators.settings).click();
  cy.xpath(queryLocators.queryTimeout)
    .clear()
    .type(timeout);

  cy.get(queryLocators.query).click();
});

//Usage: If in need to type {enter} {esc} etc then .text('sometext').type('{enter}')
Cypress.Commands.add("text", { prevSubject: true }, (subject, text) => {
  subject.val(text);
  return cy.wrap(subject);
});

//Not Used!
Cypress.Commands.add("VerifyNoDataDisplayAbsence", () => {
  cy.xpath("//div[text()='No data to display']", { timeout: 0 }).should(
    "not.exist",
  );
});

// Cypress.Commands.add('isNotInViewport', element => {
//   cy.xpath(element).then($el => {
//     const bottom = Cypress.$(cy.state('window')).height()
//     const rect = $el[0].getBoundingClientRect()

//     expect(rect.top).to.be.greaterThan(bottom)
//     expect(rect.bottom).to.be.greaterThan(bottom)
//     expect(rect.top).to.be.greaterThan(bottom)
//     expect(rect.bottom).to.be.greaterThan(bottom)
//   })
// })

Cypress.Commands.add("isNotInViewport", (element) => {
  cy.xpath(element).should(($el) => {
    const bottom = Cypress.$(cy.state("window")).height();
    const right = Cypress.$(cy.state("window")).width();
    const rect = $el[0].getBoundingClientRect();

    expect(rect).to.satisfy(
      (rect) =>
        rect.top < 0 || rect.top > bottom || rect.left < 0 || rect.left > right,
    );
  });
});

Cypress.Commands.add("isInViewport", (element) => {
  cy.xpath(element).then(($el) => {
    const bottom = Cypress.$(cy.state("window")).height();
    const rect = $el[0].getBoundingClientRect();

    expect(rect.top).not.to.be.greaterThan(bottom);
    expect(rect.bottom).not.to.be.greaterThan(bottom);
    expect(rect.top).not.to.be.greaterThan(bottom);
    expect(rect.bottom).not.to.be.greaterThan(bottom);
  });
});

Cypress.Commands.add("validateEvaluatedValue", (value) => {
  cy.get(".t-property-evaluated-value").should("contain", value);
});

Cypress.Commands.add("CheckAndUnfoldEntityItem", (item) => {
  cy.xpath("//div[contains(@class, 't--entity-name')][text()='" + item + "']")
    .parents(commonlocators.entityItem)
    .first()
    .children(commonlocators.entityCollapseToggle)
    .invoke("attr", "name")
    .then((name) => {
      if (name === "arrow-right") {
        cy.xpath(
          "//div[contains(@class, 't--entity-name')][text()='" + item + "']",
        )
          .parents(commonlocators.entityItem)
          .first()
          .children(commonlocators.entityCollapseToggle)
          .click({ force: true });
      }
    });
});

// Cypress.Commands.overwrite("type", (originalFn, element, text, options) => {
//   const clearedText = '{selectall}{backspace}'+`${text}`;
//   return originalFn(element, clearedText, options);
// });

addMatchImageSnapshotCommand({
  failureThreshold: 0.1, // threshold for entire image
  failureThresholdType: "percent",
});

Cypress.Commands.add("DeleteEntityStateLocalStorage", () => {
  let currentURL;
  let appId;
  cy.url().then((url) => {
    currentURL = url;
    const myRegexp = /applications(.*)/;
    const match = myRegexp.exec(currentURL);
    appId = match ? match[1].split("/")[1] : null;

    if (appId !== null) {
      window.localStorage.removeItem(`explorerState_${appId}`);
    }
  });
});

Cypress.Commands.add("checkLabelForWidget", (options) => {
  // Variables
  const widgetName = options.widgetName;
  const labelText = options.labelText;
  const parentColumnSpace = options.parentColumnSpace;
  const isCompact = options.isCompact;
  const widgetSelector = `.t--widget-${widgetName}`;
  const labelSelector = `${widgetSelector} label`;
  const containerSelector = `${widgetSelector} ${options.containerSelector}`;
  const labelPositionSelector = ".t--property-control-position";
  const labelAlignmentRightSelector =
    ".t--property-control-alignment .t--button-tab-right";
  const labelWidth = options.labelWidth;

  // Drag a widget
  cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
  cy.get(`.t--widget-${widgetName}`).should("exist");

  cy.openPropertyPane(widgetName);

  // Set the label text
  cy.updateCodeInput(".t--property-control-text", labelText);
  // Assert label presence
  cy.get(labelSelector)
    .first()
    .contains(labelText);

  // Set the label position: Auto
  cy.selectDropdownValue(labelPositionSelector, "Auto");
  // Assert label position: Auto
  cy.get(containerSelector).should(
    "have.css",
    "flex-direction",
    `${isCompact ? "row" : "column"}`,
  );

  // Change the label position to Top
  cy.selectDropdownValue(labelPositionSelector, "Top");
  // Assert label position: Top
  cy.get(containerSelector).should("have.css", "flex-direction", "column");

  // Change the label position to Left
  cy.selectDropdownValue(labelPositionSelector, "Left");
  // Assert label position: Left
  cy.get(containerSelector).should("have.css", "flex-direction", "row");

  // Set the label alignment to RIGHT
  cy.get(labelAlignmentRightSelector).click();
  // Assert label alignment
  cy.get(labelSelector)
    .first()
    .should("have.css", "text-align", "right");

  // Set the label width to labelWidth cols
  cy.get(`[class*='t--property-control-width'] .bp3-input`)
    .first()
    .focus()
    .clear()
    .type(`${labelWidth}`);
  cy.wait(300);
  // Assert the label width
  cy.get(labelSelector)
    .first()
    .should("have.css", "width", `${parentColumnSpace * labelWidth}px`);
  // Increase the label width
  cy.get(`[class*='t--property-control-width'] .bp3-button-group > .bp3-button`)
    .first()
    .click();
  // Assert the increased label width
  cy.wait(300);
  cy.get(labelSelector)
    .first()
    .should("have.css", "width", `${parentColumnSpace * (labelWidth + 1)}px`);
  // Decrease the label width
  cy.get(`[class*='t--property-control-width'] .bp3-button-group > .bp3-button`)
    .last()
    .click();
  cy.wait(300);
  // Assert the decreased label width
  cy.get(labelSelector)
    .first()
    .should("have.css", "width", `${parentColumnSpace * labelWidth}px`);

  // Clean up the widget
  cy.deleteWidget(widgetSelector);
});
let LOCAL_STORAGE_MEMORY = {};

Cypress.Commands.add("saveLocalStorageCache", () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});

Cypress.Commands.add("restoreLocalStorageCache", () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});

Cypress.Commands.add(
  "typeTab",
  { prevSubject: "element" },
  (subject, shiftKey, ctrlKey) => {
    cy.wrap(subject).trigger("keydown", {
      keyCode: 9,
      which: 9,
      shiftKey: shiftKey,
      ctrlKey: ctrlKey,
    });
  },
);
