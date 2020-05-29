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
let pageidcopy = " ";

Cypress.Commands.add("CreateApp", appname => {
  cy.get(homePage.CreateApp)
    .contains("Create Application")
    .click({ force: true });
  cy.get("form input").type(appname);
  cy.get(homePage.CreateApp)
    .contains("Submit")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.wait("@getPropertyPane");
  cy.get("@getPropertyPane").should("have.property", "status", 200);
  cy.wait("@getDataSources");
  cy.get("@getDataSources").should("have.property", "status", 200);
  cy.wait("@getUser");
  cy.get("@getUser").should("have.property", "status", 200);
});

Cypress.Commands.add("DeleteApp", appName => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get('button span[icon="chevron-down"]').should("be.visible");
  cy.get(homePage.searchInput).type(appName, { force: true });
  cy.get(homePage.appMoreIcon)
    .should("have.length", 1)
    .first()
    .click({ force: true });
  cy.get(homePage.deleteButton)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.visit("/user/login");
  cy.get(loginPage.username).should("be.visible");
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword);
  cy.get(loginPage.submitBtn).click();
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});
Cypress.Commands.add("LogOut", () => {
  cy.request("POST", "/api/v1/logout").then(response => {
    expect(response.status).equal(200);
  });
});

Cypress.Commands.add("NavigateToWidgets", pageName => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(".t--page-sidebar-" + pageName + "")
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.wait("@getPage");
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("SearchApp", appname => {
  cy.get(homePage.searchInput).type(appname);
  cy.wait(2000);
  cy.get(homePage.appEditIcon)
    .first()
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  // Wait added because after opening the application editor, sometimes it takes a little time.
});

Cypress.Commands.add("SearchAPI", (apiname1, apiname2) => {
  cy.get("span:contains(".concat(apiname2).concat(")")).should("be.visible");
  cy.get(apiwidget.searchApi)
    .click({ force: true })
    .type(apiname1, { force: true });
  cy.get("span:contains(".concat(apiname1).concat(")")).should("be.visible");
  cy.get("span:contains(".concat(apiname2).concat(")")).should(
    "not.be.visible",
  );
});

Cypress.Commands.add("ResponseStatusCheck", statusCode => {
  cy.xpath(apiwidget.responseStatus).should("be.visible");
  cy.xpath(apiwidget.responseStatus).contains(statusCode);
});

Cypress.Commands.add("ResponseCheck", textTocheck => {
  //Explicit assert
  cy.get(apiwidget.responseText).should($x => {
    console.log($x);
    expect($x).contain(textTocheck);
  });
  //implicit assert
  cy.get(apiwidget.responseText).contains(textTocheck);
});

Cypress.Commands.add("NavigateToAPI_Panel", () => {
  cy.get(pages.apiEditorIcon)
    .should("be.visible")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("CreateAPI", apiname => {
  cy.get(apiwidget.createApiOnSideBar)
    .first()
    .click({ force: true });
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@getUser");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname)
    .should("have.value", apiname);
  cy.SaveAPI();
});

Cypress.Commands.add("CreateSubsequentAPI", apiname => {
  cy.get(apiwidget.createApiOnSideBar)
    .first()
    .click({ force: true });
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname)
    .should("have.value", apiname);
  cy.SaveAPI();
});

Cypress.Commands.add("EditApiName", apiname => {
  cy.wait("@getUser");
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname)
    .should("have.value", apiname);
  cy.SaveAPI();
});

Cypress.Commands.add("SaveAPI", () => {
  cy.get(apiwidget.saveButton).click({ force: true });
  cy.wait("@saveQuery");
  cy.wait("@postExecute");
});

Cypress.Commands.add("RunAPI", () => {
  cy.get(ApiEditor.ApiRunBtn).click({ force: true });
  // cy.wait('@postTrack');
  cy.wait("@postExecute");
});

Cypress.Commands.add("SaveAndRunAPI", () => {
  cy.SaveAPI();
  cy.RunAPI();
});

Cypress.Commands.add("SelectAction", action => {
  cy.get(ApiEditor.ApiVerb)
    .first()
    .click({ force: true });
  cy.xpath(action)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("ClearSearch", () => {
  cy.get(apiwidget.searchApi).clear();
});

Cypress.Commands.add("SearchAPIandClick", apiname1 => {
  cy.get(apiwidget.searchApi)
    .click({ force: true })
    .type(apiname1, { force: true });
  cy.get(".t--sidebar span:contains(".concat(apiname1).concat(")"))
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("enterDatasourceAndPath", (datasource, path) => {
  cy.get(apiwidget.resourceUrl)
    .first()
    .click({ force: true })
    .type(datasource);
  cy.xpath(apiwidget.autoSuggest)
    .first()
    .click({ force: true });
  cy.get(apiwidget.path)
    .click({ force: true })
    .type(path, { parseSpecialCharSequences: false });
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
    cy.SaveAPI();
  },
);

Cypress.Commands.add("EditSourceDetail", (baseUrl, v1method) => {
  cy.get(apiwidget.editResourceUrl)
    .first()
    .clear()
    .click({ force: true })
    .type(baseUrl);
  cy.xpath(apiwidget.autoSuggest)
    .first()
    .click({ force: true });
  cy.get(ApiEditor.ApiRunBtn).scrollIntoView();
  cy.get(apiwidget.path)
    .focus()
    .type("{selectall}{backspace}api/users/2")
    .should("have.value", v1method);
  cy.SaveAPI();
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

Cypress.Commands.add("selectPaginationType", option => {
  cy.get(apiwidget.paginationOption)
    .first()
    .click({ force: true });
  cy.xpath(option).click({ force: true });
});

Cypress.Commands.add("clickTest", testbutton => {
  cy.get(testbutton)
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
    cy.SaveAPI();
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

Cypress.Commands.add("CreationOfUniqueAPIcheck", apiname => {
  cy.get(apiwidget.createApiOnSideBar)
    .first()
    .click({ force: true });
  cy.get(apiwidget.createapi).click({ force: true });
  cy.wait("@getUser");
  cy.get(apiwidget.resourceUrl).should("be.visible");
  cy.get(apiwidget.apiTxt)
    .clear()
    .type(apiname)
    .should("have.value", apiname);
  cy.get(".bp3-popover-content").should($x => {
    console.log($x);
    expect($x).contain("Name must be unique");
  });
});

Cypress.Commands.add("MoveAPIToHome", apiname => {
  cy.get(apiwidget.popover)
    .first()
    .click({ force: true });
  cy.get(apiwidget.moveTo).click({ force: true });
  cy.get(apiwidget.home).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("MoveAPIToPage", () => {
  cy.get(apiwidget.popover)
    .first()
    .click({ force: true });
  cy.get(apiwidget.moveTo).click({ force: true });
  cy.get(
    ".single-select >div:contains('".concat(pageidcopy).concat("')"),
  ).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("CopyAPIToHome", apiname => {
  cy.get(apiwidget.popover)
    .first()
    .click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.home).click({ force: true });
  cy.wait("@createNewApi").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("DeleteAPI", apiname => {
  cy.get(apiwidget.popover)
    .first()
    .click({ force: true });
  cy.get(apiwidget.delete).click({ force: true });
  cy.wait("@deleteAction").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("CreateModal", () => {
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
  cy.get(modalWidgetPage.controlModalType)
    .find(".bp3-button")
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains("Alert Modal")
    .click();
  cy.get(modalWidgetPage.controlModalType)
    .find(".bp3-button > .bp3-button-text")
    .should("have.text", "Alert Modal");
  cy.get(commonlocators.editPropCrossButton).click();
  cy.reload();
});

Cypress.Commands.add("createModal", (modalType, ModalName) => {
  cy.get(widgetsPage.buttonOnClick)
    .get(commonlocators.dropdownSelectButton)
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains("Open Popup")
    .click();
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });

  cy.get(modalWidgetPage.controlModalType)
    .find(".bp3-button")
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains(modalType)
    .click();
  cy.xpath(homePage.homePageID).contains("All changes saved");

  // changing the model name verify
  cy.widgetText(
    ModalName,
    modalWidgetPage.modalName,
    modalWidgetPage.modalName,
  );
  cy.get(commonlocators.editPropCrossButton).click();

  //changing the Model label
  cy.get(modalWidgetPage.modalWidget + " " + widgetsPage.textWidget)
    .first()
    .trigger("mouseover");

  cy.get(widgetsPage.textWidget + " " + commonlocators.editIcon).click();
  cy.testCodeMirror(ModalName);
  cy.get(widgetsPage.textAlign + " " + commonlocators.dropDownBtn).click();
  cy.get(widgetsPage.textAlign + " .bp3-menu-item")
    .contains("Center")
    .click();
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add("CheckWidgetProperties", checkboxCss => {
  cy.get(checkboxCss).check({
    force: true,
  });
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add("UncheckWidgetProperties", checkboxCss => {
  cy.get(checkboxCss).uncheck({
    force: true,
  });
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add(
  "ChangeTextStyle",
  (dropDownValue, textStylecss, labelName) => {
    cy.get(commonlocators.dropDownIcon).click();
    cy.get("ul.bp3-menu")
      .children()
      .contains(dropDownValue)
      .click();
    cy.get(textStylecss).should("have.text", labelName);
  },
);

Cypress.Commands.add("widgetText", (text, inputcss, innercss) => {
  cy.get(commonlocators.editWidgetName)
    .dblclick({ force: true })
    .type(text)
    .type("{enter}");
  cy.get(inputcss)
    .first()
    .trigger("mouseover", { force: true });
  cy.get(innercss).should("have.text", text);
});

Cypress.Commands.add("PublishtheApp", () => {
  cy.server();
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.xpath(homePage.homePageID).contains("All changes saved");
  cy.get(homePage.publishButton).click();
  cy.wait("@publishApp");
  cy.get('a[class="bp3-button"]')
    .invoke("removeAttr", "target")
    .click({ force: true });
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

Cypress.Commands.add("testCodeMirror", value => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then($cm => {
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
      cy.get(".CodeMirror textarea")
        .first()
        .should("have.value", value);
    });
});

Cypress.Commands.add("testJsontext", (endp, js) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then($cm => {
    if ($cm.contents != "") {
      cy.log("The field is empty");
      cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
        .first()
        .clear({ force: true });
    }
    cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
      .first()
      .type(js, {
        force: true,
        parseSpecialCharSequences: false,
      });
  });
});

Cypress.Commands.add("SetDateToToday", () => {
  cy.get(formWidgetsPage.datepickerFooter)
    .contains("Today")
    .click();
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add("ClearDate", () => {
  cy.get(formWidgetsPage.datepickerFooter)
    .contains("Clear")
    .click();
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add("DeleteModal", () => {
  cy.get(widgetsPage.textbuttonWidget).dblclick("topRight", { force: true });
  cy.get(widgetsPage.deleteWidget)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("Createpage", Pagename => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(pages.AddPage).click();
  cy.get(pages.editInput)
    .type(Pagename)
    .type("{Enter}");
  pageidcopy = Pagename;
  cy.get("#loading").should("not.exist");
  cy.wait(2000);
});

Cypress.Commands.add("Deletepage", Pagename => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(".t--page-sidebar-" + Pagename + "");
  cy.get(
    ".t--page-sidebar-" +
      Pagename +
      ">.t--page-sidebar-menu-actions>.bp3-popover-target",
  ).click({ force: true });
  cy.get(pages.Menuaction).click({ force: true });
  cy.get(pages.Delete).click({ force: true });
  cy.wait(2000);
});

Cypress.Commands.add("generateUUID", () => {
  const uuid = require("uuid");
  const id = uuid.v4();
  return id;
});

Cypress.Commands.add("addDsl", dsl => {
  let currentURL;
  let pageid;
  let layoutId;
  cy.url().then(url => {
    currentURL = url;
    const myRegexp = /pages(.*)/;
    const match = myRegexp.exec(currentURL);
    pageid = match[1].split("/")[1];
    cy.log(pageidcopy + "page id copy");
    cy.log(pageid + "page id");
    //Fetch the layout id
    cy.server();
    cy.request("GET", "api/v1/pages/" + pageid).then(response => {
      const len = JSON.stringify(response.body);
      cy.log(len);
      layoutId = JSON.parse(len).data.layouts[0].id;
      // Dumpimg the DSL to the created page
      cy.request(
        "PUT",
        "api/v1/layouts/" + layoutId + "/pages/" + pageid,
        dsl,
      ).then(response => {
        expect(response.status).equal(200);
        cy.reload();
      });
    });
  });
});

Cypress.Commands.add("DeleteAppByApi", () => {
  let currentURL;
  let appId;
  cy.url().then(url => {
    currentURL = url;
    const myRegexp = /applications(.*)/;
    const match = myRegexp.exec(currentURL);
    appId = match[1].split("/")[1];

    if (appId != null) {
      cy.log(appId + "appId");
      cy.request("DELETE", "api/v1/applications/" + appId).then(response => {
        expect(response.status).equal(200);
      });
    }
  });
});

Cypress.Commands.add("togglebar", value => {
  cy.get(value)
    .check({ force: true })
    .should("be.checked");
});
Cypress.Commands.add("togglebarDisable", value => {
  cy.get(value)
    .uncheck({ force: true })
    .should("not.checked");
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
Cypress.Commands.add("dropdownDynamic", text => {
  cy.wait(2000);
  cy.get("ul[class='bp3-menu']")
    .first()
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("getAlert", alertcss => {
  cy.get(commonlocators.dropdownSelectButton).click({ force: true });
  cy.get(widgetsPage.menubar)
    .contains("Show Message")
    .click({ force: true })
    .should("have.text", "Show Message");

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
Cypress.Commands.add("widgetText", (text, inputcss, innercss) => {
  cy.get(commonlocators.editWidgetName)
    .dblclick({ force: true })
    .type(text)
    .type("{enter}");
  cy.get(inputcss)
    .first()
    .trigger("mouseover", { force: true });
  cy.get(innercss).should("have.text", text);
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

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  cy.get(datasourceEditor.datasourceEditorIcon).click({ force: true });
});

Cypress.Commands.add("getPluginFormsAndCreateDatasource", () => {
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
});

Cypress.Commands.add("NavigateToApiEditor", () => {
  cy.get(pages.apiEditorIcon).click({ force: true });
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
  cy.wait("@testDatasource").should(
    "have.nested.property",
    "response.body.data.success",
    true,
  );

  cy.get(".t--save-datasource").click();
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.get(".t--delete-datasource").click();
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("testDeleteApi", () => {
  cy.get(ApiEditor.createBlankApiCard).click({ force: true });
  cy.wait("@deleteAction").should(
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
  cy.get(datasourceEditor.datasourceEditorIcon).click({ force: true });
});

Cypress.Commands.add("NavigateToQueryEditor", () => {
  cy.get(queryEditor.queryEditorIcon).click({ force: true });
});

Cypress.Commands.add("testSaveDatasource", () => {
  cy.get(".t--test-datasource").click();
  cy.wait("@testDatasource").should(
    "have.nested.property",
    "response.body.data.success",
    true,
  );

  cy.get(".t--save-datasource").click();
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("fillMongoDatasourceForm", () => {
  cy.get(datasourceEditor["host"]).type(datasourceFormData["mongo-host"]);
  cy.get(datasourceEditor["port"]).type(datasourceFormData["mongo-port"]);
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

  cy.get(datasourceEditor["sslAuthtype"]).click();
  cy.contains(datasourceFormData["mongo-sslAuthtype"]).click({
    force: true,
  });
});

Cypress.Commands.add("fillPostgresDatasourceForm", () => {
  cy.get(datasourceEditor.host).type(datasourceFormData["postgres-host"]);
  cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
  cy.get(datasourceEditor.databaseName)
    .clear()
    .type(datasourceFormData["postgres-databaseName"]);
  cy.get(datasourceEditor.username).type(
    datasourceFormData["postgres-username"],
  );
  cy.get(datasourceEditor.password).type(
    datasourceFormData["postgres-password"],
  );
});

Cypress.Commands.add("runSaveDeleteQuery", () => {
  cy.get(queryEditor.runQuery).click();
  cy.wait("@postExecute").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.get(queryEditor.saveQuery).click();
  cy.wait("@saveQuery").should(
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

Cypress.Commands.add("openPropertyPane", widgetType => {
  const selector = `.t--draggable-${widgetType}`;
  cy.get(selector)
    .first()
    .trigger("mouseover")
    .wait(500);
  cy.get(`${selector}:first-of-type .t--widget-propertypane-toggle`)
    .first()
    .click();
});

Cypress.Commands.add("createApi", (url, parameters) => {
  cy.get("@createNewApi").then(response => {
    cy.get(ApiEditor.ApiNameField).should("be.visible");
    cy.expect(response.response.body.responseMeta.success).to.eq(true);
    cy.get(ApiEditor.ApiNameField).should(
      "have.value",
      response.response.body.data.name,
    );
  });

  cy.get(ApiEditor.dataSourceField).click();
  cy.contains(url).click({
    force: true,
  });
  cy.get(".CodeMirror.CodeMirror-empty textarea")
    .first()
    .click({ force: true })
    .type(parameters, { force: true });
  cy.SaveAPI();
  cy.get(ApiEditor.formActionButtons).should("be.visible");
  cy.get(ApiEditor.ApiRunBtn).should("not.be.disabled");
});

Cypress.Commands.add("isSelectRow", index => {
  cy.get(
    '.e-gridcontent.e-lib.e-droppable td[index="' +
      index +
      '"][aria-colindex="' +
      index +
      '"]',
  ).click({ force: true });
});

Cypress.Commands.add("readTabledata", (rowNum, colNum) => {
  const selector = `.t--draggable-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
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

Cypress.Commands.add("pageNo", index => {
  cy.get(".e-pagercontainer a")
    .eq(index)
    .click({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("pageNoValidate", index => {
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
  cy.get(widgetCss + " iframe").then($iframe => {
    const $body = $iframe.contents().find("body");
    cy.wrap($body)
      .find(htmlTag)
      .should("have.text", value);
  });
});

Cypress.Commands.add("startServerAndRoutes", () => {
  cy.server();
  cy.route("GET", "/api/v1/applications").as("applications");
  cy.route("GET", "/api/v1/users/profile").as("getUser");
  cy.route("GET", "/api/v1/plugins").as("getPlugins");
  cy.route("POST", "/api/v1/logout").as("postLogout");

  cy.route("GET", "/api/v1/configs/name/propertyPane").as("getPropertyPane");
  cy.route("GET", "/api/v1/datasources").as("getDataSources");
  cy.route("GET", "/api/v1/pages/application/*").as("getPagesForApp");
  cy.route("GET", "/api/v1/pages/*").as("getPage");
  cy.route("GET", "/api/v1/actions*").as("getActions");
  cy.route("GET", "api/v1/providers/categories").as("getCategories");
  cy.route("GET", "api/v1/import/templateCollections").as(
    "getTemplateCollections",
  );
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAPI");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApp");
  cy.route("DELETE", "/api/v1/actions/*").as("deleteAction");
  cy.route("DELETE", "/api/v1/pages/*").as("deletePage");

  cy.route("GET", "/api/v1/plugins/*/form").as("getPluginForm");
  cy.route("POST", "/api/v1/datasources").as("createDatasource");
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");

  cy.route("GET", "/api/v1/organizations").as("organizations");
  cy.route("POST", "/api/v1/actions/execute").as("executeAction");
  cy.route("POST", "/api/v1/applications/publish/*").as("publishApp");
  cy.route("PUT", "/api/v1/layouts/*/pages/*").as("updateLayout");

  cy.route("POST", "/v1/t").as("postSave");
  cy.route("PUT", "/api/v1/actions/*").as("putActions");
  cy.route("POST", "/track/*").as("postTrack");
  cy.route("POST", "/v1/m").as("postexe");
  cy.route("POST", "/api/v1/actions/execute").as("postExecute");
  cy.route("POST", "/api/v1/actions").as("postaction");

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
  cy.route("POST", "/api/v1/datasources/test").as("testDatasource");
  cy.route("PUT", "/api/v1/datasources/*").as("saveDatasource");
  cy.route("DELETE", "/api/v1/datasources/*").as("deleteDatasource");
  cy.route("DELETE", "/api/v1/applications/*").as("deleteApplication");

  cy.route("PUT", "/api/v1/actions/*").as("saveQuery");
});

Cypress.Commands.add("alertValidate", text => {
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
  const selector = `.t--widget-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});
