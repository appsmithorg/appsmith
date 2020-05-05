const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");
const commonlocators = require("../locators/commonlocators.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");

Cypress.Commands.add("CreateApp", appname => {
  cy.get(homePage.CreateApp)
    .contains("Create Application")
    .click({ force: true });
  cy.get("form input").type(appname);
  cy.get(homePage.CreateApp)
    .contains("Submit")
    .click({ force: true });
 // cy.wait(2000);
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("DeleteApp", appName => {
  cy.get(commonlocators.homeIcon).click({ force: true });
  cy.get(homePage.searchInput).type(appName);
  //cy.wait(2000);
  cy.get("#loading").should("not.exist");
  cy.get(homePage.appMoreIcon)
    .first()
    .click({ force: true });
  cy.get(homePage.deleteButton).click({ force: true });
});

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.visit("/");
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

// Cypress.Commands.add("NavigateToCommonWidgets", () => {
//   cy.get(pages.pagesIcon).click({ force: true });
//   cy.get(pages.commonWidgets)
//     .find(">div")
//     .click({ force: true });
//   cy.get("#loading").should("not.exist");
//   cy.get(pages.widgetsEditor).click();
//   cy.wait("@getPage");
//   cy.get("#loading").should("not.exist");
// });

// Cypress.Commands.add("NavigateToFormWidgets", () => {
//   cy.get(pages.pagesIcon).click({ force: true });
//   cy.get(pages.formWidgets)
//     .find(">div")
//     .click({ force: true });
//   cy.get("#loading").should("not.exist");
//   cy.get(pages.widgetsEditor).click();
//   cy.get("#loading").should("not.exist");
// });

// Cypress.Commands.add("NavigateToViewWidgets", () => {
//   cy.get(pages.pagesIcon).click({ force: true });
//   cy.get(pages.viewWidgets)
//     .find(">div")
//     .click({ force: true });
//   cy.get("#loading").should("not.exist");
//   cy.get(pages.widgetsEditor).click();
//   cy.get("#loading").should("not.exist");
// });

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
