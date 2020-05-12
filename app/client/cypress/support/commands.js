const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
const ApiEditor = require("../locators/ApiEditor.json");

Cypress.Commands.add("CreateApp", appname => {
  cy.get(homePage.CreateApp)
    .contains("Create Application")
    .click({ force: true });
  cy.get("form input").type(appname);
  cy.get(homePage.CreateApp)
    .contains("Submit")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("DeleteApp", appName => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.wait("@applications");
  cy.get(homePage.searchInput)
    .focus()
    .type(appName);
  cy.wait(2000);
  cy.get(homePage.appMoreIcon)
    .first()
    .click({ force: true });
  cy.get(homePage.deleteButton).click({ force: true });
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
    .contains("Show Modal")
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
  cy.reload();
});

Cypress.Commands.add("CheckWidgetProperties", checkBoxTypeCss => {
  cy.get(checkBoxTypeCss).check({
    force: true,
  });
  cy.xpath(homePage.homePageID).contains("All changes saved");
});

Cypress.Commands.add("UnCheckWidgetProperties", checkBoxTypeCss => {
  cy.get(checkBoxTypeCss).uncheck({
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
  cy.xpath(homePage.homePageID).contains("All changes saved");
  cy.get(homePage.publishButton).click();
  cy.wait("@publishApp");
  cy.get(homePage.publishCrossButton).click();
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
        // cy.wait("@updateLayout");
      }

      cy.get(".CodeMirror textarea")
        .first()
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // cy.wait("@updateLayout");
      cy.get(".CodeMirror textarea")
        .first()
        .should("have.value", value);
    });
});

Cypress.Commands.add("SetDateToToday", () => {
  cy.get(formWidgetsPage.datepickerWidget)
    .first()
    .trigger("mouseover");
  cy.get(formWidgetsPage.datepickerWidget)
    .children(commonlocators.editicon)
    .first()
    .click({ force: true });
  cy.get(".t--property-control-defaultdate input").click();
  cy.get(".bp3-datepicker-footer span")
    .contains("Today")
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
  // cy.Createpage("TestDsl")

  // Extracting the Page id from the Url
  cy.url().then(url => {
    currentURL = url;
    const myRegexp = /pages(.*)/;
    const match = myRegexp.exec(currentURL);
    pageid = match[1].split("/")[1];
    cy.log(pageid + "page id");

    //Fetch the layout id
    cy.server();
    cy.request(
      "GET",
      "https://release-api.appsmith.com/api/v1/pages/" + pageid,
    ).then(response => {
      const len = JSON.stringify(response.body);
      cy.log(len);
      layoutId = JSON.parse(len).data.layouts[0].id;

      // Dumpimg the DSL to the created page

      cy.request(
        "PUT",
        "https://release-api.appsmith.com/api/v1/layouts/" +
          layoutId +
          "/pages/" +
          pageid,
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
    cy.log(appId + "appId");
    cy.request(
      "DELETE",
      "https://release-api.appsmith.com/api/v1/applications/" + appId,
    ).then(response => {
      expect(response.status).equal(200);
    });
  });
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
  cy.wait("@executeAction").should(
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
