/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* This file is used to maintain comman methods across tests , refer other *.js files for adding common methods */
import { ANVIL_EDITOR_TEST, AI_AGENTS_TEST } from "./Constants.js";
import advancedFormat from "dayjs/plugin/advancedFormat";

import EditorNavigation, {
  EntityType,
  AppSidebar,
  PageLeftPane,
  PagePaneSegment,
} from "./Pages/EditorNavigation";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const path = require("path");
import { v4 as uuidv4 } from "uuid";

const dayjs = require("dayjs");
const loginPage = require("../locators/LoginPage.json");
import homePage from "../locators/HomePage";

dayjs.extend(advancedFormat);

const commonlocators = require("../locators/commonlocators.json");
const widgetsPage = require("../locators/Widgets.json");
import ApiEditor from "../locators/ApiEditor";
import { CURRENT_REPO, REPO } from "../fixtures/REPO";

const apiwidget = require("../locators/apiWidgetslocator.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");
const jsEditorLocators = require("../locators/JSEditor.json");
const queryLocators = require("../locators/QueryEditor.json");
const welcomePage = require("../locators/welcomePage.json");
import { ObjectsRegistry } from "../support/Objects/Registry";
import RapidMode from "./RapidMode";
import { featureFlagIntercept } from "./Objects/FeatureFlags";
import { PluginActionForm } from "./Pages/PluginActionForm";

const propPane = ObjectsRegistry.PropertyPane;
const agHelper = ObjectsRegistry.AggregateHelper;
const locators = ObjectsRegistry.CommonLocators;
const onboarding = ObjectsRegistry.Onboarding;
const apiPage = ObjectsRegistry.ApiPage;
const deployMode = ObjectsRegistry.DeployMode;
const assertHelper = ObjectsRegistry.AssertHelper;
const homePageTS = ObjectsRegistry.HomePage;
const table = ObjectsRegistry.Table;

const chainStart = Symbol();
const pluginActionForm = new PluginActionForm();

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
    window.localStorage.setItem("NUDGE_SHOWN_SPLIT_PANE", "true");
  });
};

export const addIndexedDBKey = (key, value) => {
  cy.window().then((window) => {
    // Opening the database
    const request = window.indexedDB.open("Appsmith", 2);

    // Handling database opening success
    request.onsuccess = (event) => {
      const db = event.target.result;

      // Creating a transaction to access the object store : keyvaluepairs
      const transaction = db.transaction(["keyvaluepairs"], "readwrite");
      const objectStore = transaction.objectStore("keyvaluepairs");

      // Adding the key
      const addRequest = objectStore.put(value, key);

      // Handling add success
      addRequest.onsuccess = () => {
        console.log("Key added successfully");
        // Closing the database connection
        db.close();
      };

      // Handling add error
      addRequest.onerror = (event) => {
        console.log("Error adding key:", event.target.error);
        // Closing the database connection
        db.close();
      };
    };

    // Handling database opening error
    request.onerror = (event) => {
      console.log("Error opening database:", event.target.error);
    };
  });
};

Cypress.Commands.add("stubPostHeaderReq", () => {
  cy.intercept("POST", "/api/v1/users/invite", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("mockPostInvite");
  cy.intercept("POST", "/api/v1/applications/invite", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("mockPostAppInvite");
});

Cypress.Commands.add("testSelfSignedCertificateSettingsInREST", (isOAuth2) => {
  cy.get(datasource.useCertInAuth).should("not.exist");
  cy.get(datasource.certificateDetails).should("not.exist");
  // cy.TargetDropdownAndSelectOption(datasource.useSelfSignedCert, "Yes");
  agHelper.CheckUncheck(datasource.useSelfSignedCert);
  cy.get(datasource.useSelfSignedCert).should("be.checked");
  if (isOAuth2) {
    cy.get(datasource.useCertInAuth).should("exist");
  } else {
    cy.get(datasource.useCertInAuth).should("not.exist");
  }
  agHelper.CheckUncheck(datasource.useSelfSignedCert, false);
});

Cypress.Commands.add("addBasicProfileDetails", (username, password) => {
  cy.get(datasource.authType).click();
  cy.xpath(datasource.basic).click();
  cy.get(datasource.basicUsername).type(username);
  cy.get(datasource.basicPassword).type(password);
});

Cypress.Commands.add("GetUrlQueryParams", () => {
  return cy.url().then((url) => {
    const arr = url.split("?")[1]?.split("&");
    const paramObj = {};
    arr &&
      arr.forEach((param) => {
        const [key, value] = param.split("=");
        paramObj[key] = value;
      });
    return cy.wrap(paramObj);
  });
});

Cypress.Commands.add("LogOutUser", () => {
  cy.wait(1000); //waiting for window to load
  homePageTS.InvokeDispatchOnStore();
  //Logout is still a POST request in CE
  if (CURRENT_REPO === REPO.CE) {
    assertHelper.AssertNetworkStatus("@postLogout", 200);
  }
});

Cypress.Commands.add("LoginUser", (uname, pword, goToLoginPage = true) => {
  goToLoginPage && cy.visit("/user/login", { timeout: 60000 });
  cy.wait(3000); //for login page to load fully for CI runs
  cy.wait("@getConsolidatedData");
  agHelper.AssertElementVisibility(loginPage.username);
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword, { log: false });
  cy.get(loginPage.submitBtn).click();
  cy.wait("@getConsolidatedData");
  cy.wait(3000);
});

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.LogOutUser();
  cy.LoginUser(uname, pword);
  if (CURRENT_REPO === REPO.CE) {
    cy.get(".createnew").should("be.visible");
    cy.get(".createnew").should("be.enabled");
  }
  initLocalstorage();
});

Cypress.Commands.add("LoginFromAPI", (uname, pword) => {
  homePageTS.LogOutviaAPI();
  let baseURL = Cypress.config().baseUrl;
  baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;

  // Clear cookies to avoid stale cookies on cypress CI
  cy.clearCookie("SESSION");

  cy.visit({
    method: "POST",
    url: "api/v1/login",
    headers: {
      origin: baseURL,
      "X-Requested-By": "Appsmith",
    },
    followRedirect: true,
    body: {
      username: uname,
      password: pword,
    },
    timeout: 60000,
  });

  // Check if cookie is present
  cy.getCookie("SESSION").then((cookie) => {
    expect(cookie).to.not.be.null;
    cy.log("cookie.value is: " + cookie.value);

    if (CURRENT_REPO === REPO.EE) {
      cy.wait(2000);
      cy.url().then((url) => {
        if (url.indexOf("/license") > -1) {
          cy.validateLicense();
        }
      });
    }

    cy.location().should((loc) => {
      expect(loc.href).to.eq(loc.origin + "/applications");
    });

    if (CURRENT_REPO === REPO.EE) {
      cy.wait(2000);
    } else {
      assertHelper.AssertNetworkStatus("getAllWorkspaces");
      assertHelper.AssertNetworkStatus("getConsolidatedData");
    }
  });
});

Cypress.Commands.add("LogOut", (toCheckgetPluginForm = true) => {
  agHelper.WaitUntilAllToastsDisappear();

  // Logout is a POST request in CE
  let httpMethod = "POST";

  if (CURRENT_REPO === REPO.CE)
    toCheckgetPluginForm &&
      assertHelper.AssertNetworkResponseData("@getConsolidatedData", false);

  cy.request({
    method: httpMethod,
    url: "/api/v1/logout",
    headers: {
      "X-Requested-By": "Appsmith",
    },
  }).then((response) => {
    expect(response.status).equal(200); //Verifying logout is success
  });
});

Cypress.Commands.add("SearchApp", (appname) => {
  cy.get(homePage.searchInput).type(appname, { force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(homePage.applicationCard)
    .first()
    .trigger("mouseover", { force: true });
  cy.get(homePage.appEditIcon).first().click({ force: true });
  cy.get("#loading").should("not.exist");
  // Wait added because after opening the application editor, sometimes it takes a little time.
});

Cypress.Commands.add("WaitAutoSave", () => {
  // wait for save query to trigger
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.wait("@saveAction");
});

Cypress.Commands.add("SelectAction", (action) => {
  cy.get(ApiEditor.ApiVerb).first().click({ force: true });
  cy.xpath(action).should("be.visible").click({ force: true });
});

Cypress.Commands.add("ClearSearch", () => {
  cy.get(commonlocators.entityExplorersearch).clear({ force: true });
});

Cypress.Commands.add("clickTest", (testbutton) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.wait("@saveAction");
  cy.get(testbutton).first().click({ force: true });
  cy.wait("@postExecute");
});

Cypress.Commands.add(
  "EvaluateCurrentValue",
  (currentValue, isValueToBeEvaluatedDynamic = false) => {
    // if the value is not dynamic, evaluated popup must be hidden
    if (!isValueToBeEvaluatedDynamic) {
      cy.get(commonlocators.evaluatedCurrentValue).should("not.exist");
    } else {
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
    }
  },
);

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
  cy.get(`.t--tabid-${tabId}`).contains(newTabName).should("be.visible");
});

Cypress.Commands.add("generateUUID", () => {
  let id = uuidv4();
  return id.split("-")[0];
});

Cypress.Commands.add("addDsl", (dsl) => {
  let pageid, layoutId, appId;
  cy.url().then((url) => {
    if (RapidMode.config.enabled && RapidMode.config.usesDSL) {
      pageid = RapidMode.config.pageID;
    } else {
      pageid = agHelper.extractPageIdFromUrl(url);
      expect(pageid).to.not.be.null;
    }

    //Fetch the layout id
    cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
      const respBody = JSON.stringify(response.body);
      const data = JSON.parse(respBody).data;
      layoutId = data.layouts[0].id;
      appId = data.applicationId;
      // Dumping the DSL to the created page
      cy.request({
        method: "PUT",
        url:
          "api/v1/layouts/" +
          layoutId +
          "/pages/" +
          pageid +
          "?applicationId=" +
          appId,
        body: dsl,
        headers: {
          "X-Requested-By": "Appsmith",
        },
      }).then((response) => {
        cy.log(response.body);
        expect(response.status).equal(200);
        if (RapidMode.config.enabled && RapidMode.config.usesDSL) {
          cy.visit(RapidMode.url());
        } else {
          cy.reload();
        }

        cy.wait("@getWorkspace");
      });
    });
  });
});

Cypress.Commands.add("DeleteAppByApi", () => {
  const appId = localStorage.getItem("applicationId");
  if (appId !== null) {
    cy.log("appId to delete is:" + appId);
    cy.request({
      method: "DELETE",
      url: "api/v1/applications/" + appId,
      failOnStatusCode: false,
      headers: {
        "X-Requested-By": "Appsmith",
      },
    }).then((response) => {
      cy.log(response.body);
      cy.log(response.status);
    });
  }
});

Cypress.Commands.add("DeleteWorkspaceByApi", () => {
  const workspaceId = localStorage.getItem("workspaceId");
  if (workspaceId !== null) {
    cy.log("workspaceId to delete is:" + workspaceId);
    cy.request({
      method: "DELETE",
      url: "api/v1/workspaces/" + workspaceId,
      failOnStatusCode: false,
      headers: {
        "X-Requested-By": "Appsmith",
      },
    }).then((response) => {
      cy.log(response.body);
      cy.log(response.status);
    });
  }
});

Cypress.Commands.add("NavigateToJSEditor", () => {
  PageLeftPane.switchSegment(PagePaneSegment.JS);
  PageLeftPane.switchToAddNew();
});

Cypress.Commands.add("selectAction", (option) => {
  cy.get(".ads-v2-menu__menu-item-children")
    .contains(option)
    .click({ force: true });
});

Cypress.Commands.add("dragAndDropToCanvas", (widgetType, { x, y }) => {
  PageLeftPane.switchSegment(PagePaneSegment.UI);
  PageLeftPane.switchToAddNew();
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector)
    .first()
    .trigger("dragstart", { force: true })
    .trigger("mousemove", x, y, { force: true });

  const option = { eventConstructor: "MouseEvent", scrollBehavior: false };

  cy.get(explorer.dropHere)
    .trigger("mousemove", x, y, option)
    .trigger("mousemove", x, y, option)
    .trigger("mouseup", x, y, option);
  agHelper.AssertAutoSave();
});

Cypress.Commands.add(
  "dragAndDropToWidget",
  (widgetType, destinationWidget, { x, y }) => {
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    PageLeftPane.switchToAddNew();
    const selector = `.t--widget-card-draggable-${widgetType}`;
    cy.wait(800);
    cy.get(selector)
      .first()
      .scrollIntoView()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    const selector2 = `.t--draggable-${destinationWidget}`;
    cy.get(selector2)
      .first()
      .scrollIntoView()
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
  },
);

Cypress.Commands.add(
  "dragAndDropToWidgetBySelector",
  (widgetType, destinationSelector, { x, y }) => {
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    PageLeftPane.switchToAddNew();
    const selector = `.t--widget-card-draggable-${widgetType}`;
    cy.wait(800);
    cy.get(selector)
      .first()
      .scrollIntoView()
      .trigger("dragstart", { force: true })
      .trigger("mousemove", x, y, { force: true });
    cy.get(destinationSelector)
      .first()
      .scrollIntoView()
      .scrollTo("top", { ensureScrollable: false })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
  },
);

Cypress.Commands.add("changeButtonColor", (buttonColor) => {
  cy.get(widgetsPage.buttonColor)
    .click({ force: true })
    .clear()
    .type(buttonColor, { delay: 0 });
  deployMode.DeployApp();
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

Cypress.Commands.add(
  "onClickActions",
  (forSuccess, forFailure, actionType, actionValue, idx = 0) => {
    propPane.SelectActionByTitleAndValue(actionType, actionValue);

    agHelper.Sleep();

    // add a success callback
    cy.get(propPane._actionAddCallback("success")).click().wait(500);
    cy.get(locators._dropDownValue("Show alert")).click().wait(500);
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      forSuccess,
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);

    // add a failure callback
    cy.get(propPane._actionAddCallback("failure")).click().wait(500);
    cy.get(locators._dropDownValue("Show alert")).click().wait(500);
    agHelper.TypeText(
      propPane._actionSelectorFieldByLabel("Message"),
      forFailure,
    );
    agHelper.GetNClick(propPane._actionSelectorPopupClose);
  },
);

Cypress.Commands.add("getDate", (date, dateFormate) => {
  const eDate = dayjs().add(date, "days").format(dateFormate);
  return eDate;
});

Cypress.Commands.add("setDate", (date, dateFormate, ver = "v2") => {
  if (ver == "v2") {
    const expDate = dayjs().add(date, "days").format("dddd, MMMM D");
    cy.get(`.react-datepicker__day[aria-label^="Choose ${expDate}"]`)
      .first()
      .click();
  } else if (ver == "v1") {
    const expDate = dayjs().add(date, "days").format(dateFormate);
    const sel = `.DayPicker-Day[aria-label=\"${expDate}\"]`;
    cy.get(sel).click();
  }
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
    cy.wrap($body).find(htmlTag).should("have.text", value);
  });
});
Cypress.Commands.add("setTinyMceContent", (tinyMceId, content) => {
  cy.window().then((win) => {
    const editor = win.tinymce.EditorManager.get(tinyMceId);
    editor.setContent(content);
  });
});

Cypress.Commands.add("startServerAndRoutes", () => {
  //To update route with intercept after working on alias wrt wait and alias
  //cy.server();
  cy.intercept("PUT", "/api/v1/themes/applications/*").as("updateTheme");
  cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.intercept("POST", "/api/v1/datasources").as("saveDatasource");
  cy.intercept("GET", "/api/v1/applications/new").as("applications");
  cy.intercept("GET", "/api/v1/users/profile").as("getUser");
  cy.intercept("GET", "/api/v1/plugins?workspaceId=*").as("getPlugins");

  cy.intercept("POST", "/api/v1/logout").as("postLogout");

  cy.intercept("GET", "/api/v1/datasources?workspaceId=*").as("getDataSources");
  cy.intercept("GET", "/api/v1/pages?*mode=EDIT").as("getPagesForCreateApp");
  cy.intercept("GET", "/api/v1/pages?*mode=PUBLISHED").as("getPagesForViewApp");
  cy.intercept("GET", "/api/v1/applications/releaseItems").as(
    "getReleaseItems",
  );
  cy.intercept("GET", "/api/v1/workspaces/home").as("getAllWorkspaces");
  cy.intercept("GET", "/api/v1/applications/home?workspaceId=*").as(
    "getApplicationsOfWorkspace",
  );

  cy.intercept("POST");
  cy.intercept("GET", "/api/v1/pages/*").as("getPage");
  cy.intercept("GET", "/api/v1/applications/*/pages/*/edit").as(
    "getAppPageEdit",
  );
  cy.intercept("GET", "/api/v1/actions*").as("getActions");
  cy.intercept("PUT", "/api/v1/pages/*").as("updatePage");
  cy.intercept("PUT", "api/v1/applications/*/page/*/makeDefault").as(
    "makePageDefault",
  );
  cy.intercept("DELETE", "/api/v1/applications/*").as("deleteApp");
  cy.intercept("DELETE", "/api/v1/pages/*").as("deletePage");
  //cy.intercept("POST", "/api/v1/datasources").as("createDatasource");
  cy.intercept("DELETE", "/api/v1/datasources/*").as("deleteDatasource");
  cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*").as(
    "getDatasourceStructure",
  );
  cy.intercept("PUT", "/api/v1/datasources/datasource-query/*").as(
    "datasourceQuery",
  );

  cy.intercept("POST", "/api/v1/datasources/*/trigger").as("trigger");

  cy.intercept("PUT", "/api/v1/pages/crud-page/*").as(
    "replaceLayoutWithCRUDPage",
  );
  cy.intercept("POST", "/api/v1/pages/crud-page").as("generateCRUDPage");

  cy.intercept("GET", "/api/v1/workspaces").as("workspaces");
  cy.intercept("GET", "/api/v1/workspaces/*").as("getWorkspace");

  cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.intercept("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.intercept("POST", "/track/*").as("postTrack");
  cy.intercept("PUT", "/api/v1/actions/executeOnLoad/*").as("setExecuteOnLoad");

  cy.intercept("POST", "/api/v1/actions").as("createNewApi");
  cy.intercept("POST", "/api/v1/import?type=CURL&contextId=*&name=*").as(
    "curlImport",
  );
  cy.intercept("DELETE", "/api/v1/actions/*").as("deleteAction");

  cy.intercept("GET", "/api/v1/plugins/*/form").as("getPluginForm");
  cy.intercept("DELETE", "/api/v1/applications/*").as("deleteApplication");
  cy.intercept("POST", "/api/v1/applications", (req) => {
    // we don't let creating application in anvil or ai agents test with create application button,
    // but our tests are written to use the create application button, so we override the request body
    // to create an application with anvil layout system and hide the navbar
    if (
      Cypress.currentTest.titlePath[0].includes(ANVIL_EDITOR_TEST) ||
      Cypress.currentTest.titlePath[0].includes(AI_AGENTS_TEST)
    ) {
      req.body.positioningType = "ANVIL";
      req.body.showNavbar = false;
    }

    req.continue();
  }).as("createNewApplication");
  cy.intercept("PUT", "/api/v1/applications/*").as("updateApplication");
  cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
  cy.intercept("PUT", "/api/v1/actions/move").as("moveAction");

  cy.intercept("POST", "/api/v1/workspaces").as("createWorkspace");
  cy.intercept("POST", "api/v1/applications/import/*").as(
    "importNewApplication",
  );
  cy.intercept("GET", "api/v1/applications/export/*").as("exportApplication");
  cy.intercept("GET", "/api/v1/workspaces/*/permissionGroups").as("getRoles");
  cy.intercept("GET", "/api/v1/users/me").as("getMe");
  cy.intercept("POST", "/api/v1/pages").as("createPage");
  cy.intercept("POST", "/api/v1/pages/clone/*").as("clonePage");
  cy.intercept("POST", "/api/v1/applications/clone/*").as("cloneApp");
  cy.intercept("PUT", "/api/v1/applications/*/changeAccess").as("changeAccess");

  cy.intercept("PUT", "/api/v1/workspaces/*").as("updateWorkspace");
  cy.intercept("GET", "/api/v1/pages/view/application/*").as("viewApp");
  cy.intercept("GET", "/api/v1/pages/*/view?*").as("viewPage");
  cy.intercept("POST", "/api/v1/workspaces/*/logo").as("updateLogo");
  cy.intercept("DELETE", "/api/v1/workspaces/*/logo").as("deleteLogo");
  cy.intercept("POST", "/api/v1/applications/*/fork/*").as(
    "postForkAppWorkspace",
  );
  cy.intercept("PUT", "/api/v1/users/leaveWorkspace/*").as(
    "leaveWorkspaceApiCall",
  );
  cy.intercept("DELETE", "api/v1/workspaces/*").as("deleteWorkspaceApiCall");

  cy.intercept("POST", "/api/v1/comments/threads").as("createNewThread");
  cy.intercept("POST", "/api/v1/comments?threadId=*").as("createNewComment");

  cy.intercept("POST", "api/v1/git/commit/app/*").as("commit");
  cy.intercept("POST", "/api/v1/git/import/*").as("importFromGit");
  cy.intercept("POST", "/api/v1/git/merge/app/*").as("mergeBranch");
  cy.intercept("POST", "/api/v1/git/merge/status/app/*").as("mergeStatus");
  cy.intercept("PUT", "api/v1/collections/actions/refactor").as(
    "renameJsAction",
  );

  cy.intercept("POST", "/api/v1/collections/actions").as(
    "createNewJSCollection",
  );
  cy.intercept("POST", "/api/v1/pages/crud-page").as(
    "replaceLayoutWithCRUDPage",
  );

  cy.intercept("PUT", "api/v1/collections/actions/*").as("jsCollections");
  cy.intercept("DELETE", "/api/v1/collections/actions/*").as(
    "deleteJSCollection",
  );
  cy.intercept("POST", "/api/v1/users/super").as("createSuperUser");
  cy.intercept("POST", "/api/v1/actions/execute").as("postExecute");
  cy.intercept("GET", "/api/v1/admin/env").as("getEnvVariables");
  cy.intercept("DELETE", "/api/v1/git/branch/app/*").as("deleteBranch");
  cy.intercept("GET", "/api/v1/git/branch/app/*").as("getBranch");
  cy.intercept("POST", "/api/v1/git/create-branch/app/*").as("createBranch");
  cy.intercept("GET", "/api/v1/git/status/app/*").as("gitStatus");
  cy.intercept("PUT", "/api/v1/layouts/refactor").as("updateWidgetName");
  cy.intercept("GET", "/api/v1/workspaces/*/members").as("getMembers");
  cy.intercept("POST", "/api/v1/datasources/mocks").as("getMockDb");
  cy.intercept("GET", "/api/v1/app-templates").as("fetchTemplate");
  cy.intercept("POST", "/api/v1/app-templates/*").as("importTemplate");
  cy.intercept("GET", /\/api\/v1\/app-templates\/(?!(filters)).*/).as(
    "getTemplatePages",
  );
  cy.intercept("PUT", "/api/v1/datasources/*").as("updateDatasource");
  cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as("generateKey");
  cy.intercept("GET", "/api/v1/applications/ssh-keypair/*").as("generatedKey");
  cy.intercept("POST", "/api/v1/applications/snapshot/*").as("snapshotSuccess");
  cy.intercept("GET", "/api/v1/applications/snapshot/*").as("pageSnap");
  cy.intercept(
    {
      method: "POST",
      url: "/api/v1/git/connect/app/*",
      hostname: window.location.host,
    },
    (req) => {
      req.headers["origin"] = "Cypress";
    },
  ).as("connectGitLocalRepo");

  cy.intercept("POST", "https://api.segment.io/v1/b", (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: false, //since anything can be faked!
      },
    });
  });

  cy.intercept("PUT", "/api/v1/admin/env", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("postEnv");

  cy.intercept("GET", "/settings/general").as("getGeneral");
  cy.intercept("GET", "/api/v1/tenants/current").as("signUpLogin");
  cy.intercept("PUT", "/api/v1/tenants", (req) => {
    req.headers["origin"] = "Cypress";
  }).as("postTenant");
  cy.intercept("PUT", "/api/v1/git/discard/app/*").as("discardChanges");
  cy.intercept("GET", "/api/v1/libraries/*").as("getLibraries");

  if (
    Cypress.currentTest.titlePath[0].includes(ANVIL_EDITOR_TEST) ||
    Cypress.currentTest.titlePath[0].includes(AI_AGENTS_TEST)
  ) {
    // intercept features call for creating pages that support Anvil + WDS tests
    featureFlagIntercept({ release_anvil_enabled: true }, false);
  } else {
    featureFlagIntercept({}, false);
  }

  cy.intercept(
    {
      method: "GET",
      url: "/api/v1/product-alert/alert",
    },
    (req) => {
      req.reply((res) => {
        if (res) {
          if (res.statusCode === 200) {
            // Modify the response body to have empty data
            res.send({
              responseMeta: {
                status: 200,
                success: true,
              },
              data: {},
              errorDisplay: "",
            });
          }
        } else {
          // Do nothing or handle the case where the response object is not present
        }
      });
    },
  ).as("productAlert");
  cy.intercept(
    {
      method: "GET",
      url: /domain\/docs\.appsmith\.com\/token$/,
    },
    {
      statusCode: 200,
    },
  ).as("docsCall");
  cy.intercept("POST", "/api/v1/datasources/*/schema-preview").as(
    "schemaPreview",
  );
  cy.intercept("GET", "/api/v1/pages/*/view?v=*").as("templatePreview");
});

Cypress.Commands.add("startErrorRoutes", () => {
  cy.intercept("POST", "/api/v1/actions/execute", { statusCode: 500 }).as(
    "postExecuteError",
  );
});

Cypress.Commands.add("NavigateToPaginationTab", () => {
  apiPage.SelectPaneTab("Pagination");
  agHelper.GetNClick(ApiEditor.apiPaginationTab);
});

Cypress.Commands.add("ValidatePaginateResponseUrlData", (runTestCss) => {
  EditorNavigation.SelectEntityByName("Api2", EntityType.Api);
  cy.wait(3000);
  cy.NavigateToPaginationTab();
  cy.RunAPI();
  cy.get(ApiEditor.apiPaginationNextTest).click();
  cy.wait("@postExecute");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(runTestCss).click();
  cy.wait(2000);
  cy.xpath("//div[@class='tr'][1]//div[@class='td as-mask'][6]//span")
    .invoke("text")
    .then((valueToTest) => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.SelectTableRow(0);
      cy.readTabledata("0", "5").then((tabData) => {
        const tableData = tabData;
        expect(valueToTest).contains(tableData);
      });
    });
});

Cypress.Commands.add("ValidatePaginateResponseUrlDataV2", (runTestCss) => {
  EditorNavigation.SelectEntityByName("Api2", EntityType.Api);
  cy.wait(3000);
  cy.NavigateToPaginationTab();
  cy.RunAPI();
  cy.get(ApiEditor.apiPaginationNextTest).click();
  cy.wait("@postExecute");
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(runTestCss).click();
  cy.wait(2000);
  cy.xpath("//div[@class='tr'][1]//div[@class='td as-mask'][6]//span")
    .invoke("text")
    .then((valueToTest) => {
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.wait(2000);
      table.SelectTableRow(0, 0, true, "v2");
      cy.readTableV2data("0", "5").then((tabData) => {
        const tableData = tabData;
        cy.log(valueToTest);
        expect(valueToTest).contains(tableData);
      });
    });
});

Cypress.Commands.add("CheckForPageSaveError", () => {
  // Wait for "saving" status to disappear
  cy.get(commonlocators.statusSaving, {
    timeout: 30000,
  }).should("not.exist");
  // Check for page save error
  cy.get("body").then(($ele) => {
    if ($ele.find(commonlocators.saveStatusError).length) {
      cy.reload();
    }
  });
});

Cypress.Commands.add(
  "validateCodeEditorContent",
  (selector, contentToValidate) => {
    cy.get(selector).within(() => {
      cy.get(".CodeMirror-code").should("have.text", contentToValidate);
    });
  },
);

Cypress.Commands.add("createSuperUser", () => {
  cy.wait(1000);
  cy.get(welcomePage.firstName).should("be.visible");
  cy.get(welcomePage.lastName).should("be.visible");
  cy.get(welcomePage.email).should("be.visible");
  cy.get(welcomePage.password).should("be.visible");
  cy.get(welcomePage.verifyPassword).should("be.visible");
  cy.get(welcomePage.continueButton).should("be.disabled");

  cy.get(welcomePage.firstName).type(Cypress.env("USERNAME"));
  cy.get(welcomePage.continueButton).should("be.disabled");
  cy.get(welcomePage.email).type(Cypress.env("USERNAME"));
  cy.get(welcomePage.continueButton).should("be.disabled");
  cy.get(welcomePage.password).type(Cypress.env("PASSWORD"));
  cy.get(welcomePage.continueButton).should("be.disabled");
  cy.get(welcomePage.verifyPassword).type(Cypress.env("PASSWORD"));
  cy.get(welcomePage.continueButton).should("not.be.disabled");
  cy.get(welcomePage.continueButton).click();

  cy.get(welcomePage.proficiencyGroupButton).eq(0).click();
  cy.get(welcomePage.submitButton).should("be.disabled");
  cy.get(welcomePage.useCaseGroupButton).eq(0).click();
  cy.get(welcomePage.submitButton).should("not.be.disabled");

  cy.get(welcomePage.submitButton).click();
  //in case of airgapped both anonymous data and newsletter are disabled
  if (Cypress.env("AIRGAPPED")) {
    cy.wait("@createSuperUser").then((interception) => {
      expect(interception.request.body).to.not.contain(
        "allowCollectingAnonymousData=true",
      );
      expect(interception.request.body).to.not.contain(
        "signupForNewsletter=true",
      );
    });
  } else {
    cy.wait("@createSuperUser").then((interception) => {
      expect(interception.request.body).contains(
        "allowCollectingAnonymousData=true",
      );
      expect(interception.request.body).contains("signupForNewsletter=true");
    });
  }

  cy.wait(2000);

  if (CURRENT_REPO === REPO.CE) {
    assertHelper.AssertNetworkStatus("@getApplicationsOfWorkspace");
    agHelper.WaitUntilEleAppear(onboarding.locators.skipStartFromData);
    agHelper.GetNClick(onboarding.locators.skipStartFromData);
    cy.get("#loading").should("not.exist");
    AppSidebar.assertVisible();
  }

  cy.LogOut();
  cy.wait(2000);
});

Cypress.Commands.add("SignupFromAPI", (uname, pword) => {
  cy.request({
    method: "POST",
    url: "api/v1/users",
    headers: {
      "X-Requested-By": "Appsmith",
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

// the way we target form controls from now on has to change
// we would be getting the form controls by their class names and not their xpaths.
// the xpath method is flaky and highly subjected to change.
Cypress.Commands.add(
  "typeValueNValidate",
  (valueToType, fieldName = "", isDynamic = false) => {
    cy.wait(2000);
    if (fieldName) {
      cy.get(fieldName).then(($field) => {
        cy.updateCodeInput($field, valueToType);
      });
    } else {
      cy.xpath("//div[@class='CodeEditorTarget']").then(($field) => {
        cy.updateCodeInput($field, valueToType);
      });
    }
    cy.EvaluateCurrentValue(valueToType, isDynamic);
  },
);

Cypress.Commands.add("clickButton", (btnVisibleText, toForceClick = true) => {
  cy.xpath("//span[text()='" + btnVisibleText + "']/ancestor::button")
    .first()
    .scrollIntoView()
    .click({ force: toForceClick });
});

Cypress.Commands.add(
  "EvaluatFieldValue",
  (fieldName = "", currentValue = "") => {
    let val = "";
    if (fieldName) {
      cy.get(fieldName).click();
      val = cy.get(fieldName).then(($field) => {
        cy.wrap($field).find(".CodeMirror-code span").first().invoke("text");
      });
    } else {
      cy.xpath("//div[@class='CodeMirror-code']").first().click();
      val = cy
        .xpath(
          "//div[@class='CodeMirror-code']//span[contains(@class,'cm-m-javascript')]",
        )
        .then(($field) => {
          cy.wrap($field).invoke("text");
        });
    }
    if (currentValue) expect(val).to.eq(currentValue);

    return val;
  },
);

// Cypress >=8.3.x  onwards
cy.all = function (...commands) {
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

Cypress.Commands.add("getEntityName", () => {
  let entityName = agHelper.GetObjectName();
  return entityName;
});

Cypress.Commands.add("VerifyErrorMsgAbsence", (errorMsgToVerifyAbsence) => {
  cy.xpath(
    "//div[@class='Toastify']//span[contains(text(),'" +
      errorMsgToVerifyAbsence +
      "')]",
    { timeout: 0 },
  ).should("not.exist");
});

Cypress.Commands.add("VerifyErrorMsgPresence", (errorMsgToVerifyAbsence) => {
  cy.xpath(
    "//div[@class='Toastify']//span[contains(text(),'" +
      errorMsgToVerifyAbsence +
      "')]",
    { timeout: 0 },
  ).should("exist");
});

Cypress.Commands.add("setQueryTimeout", (timeout) => {
  pluginActionForm.toolbar.toggleSettings();
  cy.xpath(queryLocators.queryTimeout).clear().type(timeout);
  pluginActionForm.toolbar.toggleSettings();
});

Cypress.Commands.add("isInViewport", (element) => {
  cy.xpath(element)
    .scrollIntoView()
    .then(($el) => {
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
  const labelContainer = `${widgetSelector} .label-container`;
  const containerSelector = `${widgetSelector} ${options.containerSelector}`;
  const labelPositionSelector = ".t--property-control-position";
  const labelAlignmentRightSelector =
    ".t--property-control-alignment .ads-v2-segmented-control__segments-container-segment[data-value='right']";
  const labelWidth = options.labelWidth;

  // Drag a widget
  cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
  cy.get(`.t--widget-${widgetName}`).should("exist");

  // Set the label text
  cy.updateCodeInput(".t--property-control-text", labelText);
  // Assert label presence
  cy.get(labelSelector).first().contains(labelText);

  // Set the label position: Auto
  cy.get(".ads-v2-segmented-control-value-Auto").click({ force: true });
  // Assert label position: Auto
  cy.get(containerSelector).should("have.css", "flex-direction", "column");

  // Change the label position to Top
  cy.get(".ads-v2-segmented-control-value-Top").click({ force: true });
  // Assert label position: Top
  cy.get(containerSelector).should("have.css", "flex-direction", "column");

  // Change the label position to Left
  cy.get(".ads-v2-segmented-control-value-Left").click({ force: true });
  // Assert label position: Left
  cy.get(containerSelector).should("have.css", "flex-direction", "row");

  // Set the label alignment to RIGHT
  cy.get(labelAlignmentRightSelector).click();
  // Assert label alignment
  cy.get(labelSelector).first().should("have.css", "text-align", "right");

  // Clean up the widget
  cy.deleteWidget(widgetSelector);
});
let LOCAL_STORAGE_MEMORY = {};

Cypress.Commands.add("StopContainer", (path, containerName) => {
  cy.request({
    method: "GET",
    url: path,
    qs: {
      cmd: "docker stop " + containerName,
    },
  }).then((res) => {
    cy.log(res.body.stdout, res.body.stderr);
    expect(res.status).equal(200);
  });
});

Cypress.Commands.add(
  "StartNewContainer",
  (url, path, version, containerName) => {
    let comm =
      "docker run -d --name " +
      containerName +
      ' -p 8081:80 -p 9002:9002 -v "' +
      path +
      '/stacks:/appsmith-stacks" ' +
      version;

    cy.log(comm);
    cy.request({
      method: "GET",
      url: url,
      qs: {
        cmd: comm,
      },
    }).then((res) => {
      cy.log("ContainerID", res.body.stdout);
      cy.log(res.body.stderr);
      expect(res.status).equal(200);
    });
  },
);

Cypress.Commands.add("GetPath", (path, containerName) => {
  cy.request({
    method: "GET",
    url: path,
    qs: {
      cmd:
        "docker inspect -f '{{ .Mounts }}' " +
        containerName +
        "|awk '{print $2}'",
    },
  }).then((res) => {
    return res.body.stdout;
  });
});

Cypress.Commands.add("GetAndVerifyLogs", (path, containerName) => {
  cy.request({
    method: "GET",
    url: path,
    qs: {
      cmd: "docker logs " + containerName + " 2>&1 | grep 'APPLIED'",
    },
  }).then((res) => {
    expect(res.status).equal(200);
    //expect(res.body.stdout).not.equal("");
  });
});

Cypress.Commands.add("forceVisit", (url) => {
  cy.window().then((win) => {
    return win.open(url, "_self");
  });
});

Cypress.Commands.add("SelectDropDown", (dropdownOption) => {
  cy.wait(1000);
  cy.get(".t--widget-selectwidget button").first().scrollIntoView().click();
  cy.get(".t--widget-selectwidget button .cancel-icon")
    .first()
    .click({ force: true })
    .wait(1000);
  cy.get(".t--widget-selectwidget button").first().click({ force: true });
  cy.document()
    .its("body")
    .find(".menu-item-link:contains('" + dropdownOption + "')")
    .click({
      force: true,
    })
    .wait(1000);
});

Cypress.Commands.add("RemoveAllSelections", () => {
  cy.get(`.rc-select-selection-overflow-item .remove-icon`).each(($each) => {
    cy.wrap($each).click({ force: true }).wait(1000);
  });
});

Cypress.Commands.add("SelectFromMultiSelect", (options) => {
  const option = (value) =>
    `.rc-select-item-option[title=${value}] input[type='checkbox']`;
  cy.get(" .t--widget-multiselectwidgetv2 div.rc-select-selector")
    .eq(0)
    .scrollIntoView()
    .then(($element) => {
      // here, we try to click on downArrow in dropdown of multiSelect.
      // the position is calculated from top left of the element
      const dropdownCenterPosition = +$element.height / 2;
      const dropdownArrowApproxPosition = +$element.width - 10;
      cy.get($element).click(
        dropdownArrowApproxPosition,
        dropdownCenterPosition,
        {
          force: true,
        },
      );
    });

  options.forEach(($each) => {
    cy.document()
      .its("body")
      .find(".rc-select-dropdown.multi-select-dropdown")
      .not(".rc-select-dropdown-hidden")
      .find(option($each))
      .check({ force: true })
      .wait(1000);
    cy.document().its("body").find(option($each)).should("be.checked");
  });
  //Closing dropdown
  cy.get(" .t--widget-multiselectwidgetv2 div.rc-select-selector")
    .eq(0)
    .scrollIntoView()
    .then(($element) => {
      // here, we try to click on downArrow in dropdown of multiSelect.
      // the position is calculated from top left of the element
      const dropdownCenterPosition = +$element.height / 2;
      const dropdownArrowApproxPosition = +$element.width - 10;
      cy.get($element).click(
        dropdownArrowApproxPosition,
        dropdownCenterPosition,
        {
          force: true,
        },
      );
    });
  //cy.document().its("body").type("{esc}");
});

Cypress.Commands.add("skipSignposting", () => {
  onboarding.skipSignposting();
});

Cypress.Commands.add("stubPricingPage", () => {
  cy.window().then((win) => {
    cy.stub(win, "open", (url) => {
      win.location.href = "https://www.appsmith.com/pricing?";
    }).as("pricingPage");
  });
});

Cypress.Commands.add("stubCustomerPortalPage", () => {
  cy.window().then((win) => {
    cy.stub(win, "open", (url) => {
      win.location.href = "https://customer.appsmith.com?";
    }).as("customerPortalPage");
  });
});

/**
 * @param tooltipSelector
 * @param expectedText
 * @returns
 *
 *
 */
Cypress.Commands.add(
  "assertTooltipPresence",
  (tooltipSelector = "", expectedText) => {
    cy.get(tooltipSelector).should("be.visible").and("contain", expectedText);
  },
);

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

Cypress.Commands.add("LogintoAppTestUser", (uname, pword) => {
  cy.LogOutUser();
  cy.LoginUser(uname, pword);
  initLocalstorage();
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
  cy.get(jsEditorLocators.runButton).first().click();
});

Cypress.Commands.add("CheckAndUnfoldEntityItem", (item) => {
  PageLeftPane.expandCollapseItem(item);
});

Cypress.Commands.add("text", { prevSubject: true }, (subject, text) => {
  subject.val(text);
  return cy.wrap(subject);
});
