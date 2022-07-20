import homePage from "../../../../locators/HomePage";
const dsl = require("../../../../fixtures/displayWidgetDsl.json");

describe("Workspace Import Application", function() {
  let workspaceId;
  let newWorkspaceName;
  let appname;

  before(() => {
    cy.addDsl(dsl);
    cy.wait(5000);
  });

  it("Can Import Application from json", function() {
    cy.NavigateToHome();
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.searchInput).clear();
    cy.get(`a[id=t--export-app-link]`).then((anchor) => {
      const url = anchor.prop("href");
      cy.request(url).then(({ body, headers }) => {
        expect(headers).to.have.property("content-type", "application/json");
        expect(headers).to.have.property(
          "content-disposition",
          `attachment; filename*=UTF-8''${appname}.json`,
        );
        cy.writeFile("cypress/fixtures/exported-app.json", body, "utf-8");

        cy.generateUUID().then((uid) => {
          workspaceId = uid;
          localStorage.setItem("WorkspaceName", workspaceId);
          cy.createWorkspace();
          cy.wait("@createWorkspace").then((createWorkspaceInterception) => {
            newWorkspaceName =
              createWorkspaceInterception.response.body.data.name;
            cy.renameWorkspace(newWorkspaceName, workspaceId);
            cy.get(homePage.workspaceImportAppOption).click({ force: true });

            cy.get(homePage.workspaceImportAppModal).should("be.visible");
            cy.xpath(homePage.uploadLogo).attachFile("exported-app.json");

            cy.wait("@importNewApplication").then((interception) => {
              const importedApp = interception.response.body.data.application;
              const { pages } = importedApp;
              const appSlug = importedApp.slug;
              let defaultPage = pages.find((eachPage) => eachPage.isDefault);
              cy.get(homePage.toastMessage).should(
                "contain",
                "Application imported successfully",
              );
              cy.wait("@getPagesForCreateApp").then((interception) => {
                const pages = interception.response.body.data.pages;
                const pageSlug =
                  pages.find((page) => page.isDefault)?.slug ?? "page";
                cy.url().should(
                  "include",
                  `/${appSlug}/${pageSlug}-${defaultPage.id}`,
                );
              });
            });
          });
        });
      });
    });
  });
});
