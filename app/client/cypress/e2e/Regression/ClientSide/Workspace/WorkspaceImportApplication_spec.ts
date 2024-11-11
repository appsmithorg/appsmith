import homePageLocators from "../../../../locators/HomePage";
import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";

describe(
  "Workspace Import Application",
  { tags: ["@tag.Workspace", "@tag.Sanity", "@tag.AccessControl"] },
  function () {
    let workspaceId;
    let newWorkspaceName;
    let appname, workspaceName;

    before(() => {
      agHelper.AddDsl("displayWidgetDsl");
    });

    it("1. Can Import Application from json", function () {
      homePage.NavigateToHome();
      workspaceName = localStorage.getItem("workspaceName");
      appname = localStorage.getItem("appName");

      cy.get(homePageLocators.searchInput).type(workspaceName);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(homePageLocators.appMoreIcon).first().click({ force: true });
      cy.get(homePageLocators.exportAppFromMenu).click({ force: true });
      agHelper.ValidateToastMessage("Successfully exported");
      // fetching the exported app file manually to be verified.
      cy.get(homePageLocators.searchInput).clear();
      cy.get(`a[id=t--export-app-link]`).then((anchor) => {
        const url = anchor.prop("href");
        cy.request(url).then(({ body, headers }) => {
          expect(headers).to.have.property("content-type", "application/json");
          expect(headers)
            .to.have.property("content-disposition")
            .that.includes("attachment;")
            .and.includes(
              `filename="=?UTF-8?Q?${appname.replace(/\s/g, "_")}.json`,
            );
          cy.writeFile("cypress/fixtures/exported-app.json", body, "utf-8");

          cy.generateUUID().then((uid) => {
            workspaceId = uid;
            cy.createWorkspace();
            cy.wait("@createWorkspace").then((createWorkspaceInterception) => {
              newWorkspaceName =
                createWorkspaceInterception.response.body.data.name;
              homePage.RenameWorkspace(newWorkspaceName, workspaceId);
              agHelper.GetNClick(homePageLocators.createNew, 0, true);
              agHelper.GetNClick(
                homePageLocators.workspaceImportAppOption,
                0,
                true,
              );

              cy.get(homePageLocators.workspaceImportAppModal).should(
                "be.visible",
              );
              cy.xpath(homePageLocators.uploadLogo)
                .first()
                .selectFile("cypress/fixtures/exported-app.json", {
                  force: true,
                });

              cy.wait("@importNewApplication").then((interception) => {
                const importedApp = interception.response.body.data.application;
                const { pages } = importedApp;
                const appSlug = importedApp.slug;
                let defaultPage = pages.find((eachPage) => eachPage.isDefault);
                cy.get(homePageLocators.toastMessage).should(
                  "contain",
                  "Application imported successfully",
                );
                agHelper.WaitUntilAllToastsDisappear();
                cy.get("@getConsolidatedData").then((interception) => {
                  const pages =
                    interception.response.body.data.pages.data.pages;
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
  },
);
