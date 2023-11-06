const explorer = require("../../../../locators/explorerlocators.json");
import {
  agHelper,
  assertHelper,
  entityExplorer,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe("Slug URLs", () => {
  let applicationName;
  let applicationId;

  it("1. Checks URL redirection from legacy URLs to slug URLs", () => {
    applicationId = localStorage.getItem("applicationId");
    cy.location("pathname").then((pathname) => {
      const pageId = pathname.split("/")[3]?.split("-").pop();
      cy.visit(`/applications/${applicationId}/pages/${pageId}/edit`).then(
        () => {
          cy.wait(10000);
          cy.location("pathname").then((pathname) => {
            const pageId = pathname.split("/")[3]?.split("-").pop();
            const appName = localStorage
              .getItem("appName")
              .replace(/\s+/g, "-")
              .toLowerCase();
            expect(pathname).to.be.equal(
              `/app/${appName}/page1-${pageId}/edit`,
            );
          });
        },
      );
    });
  });

  it("2. Checks if application slug updates on the URL when application name changes", () => {
    cy.generateUUID().then((appName) => {
      applicationName = appName;
      homePage.RenameApplication(applicationName);
      assertHelper.AssertNetworkStatus("updateApplication");
      cy.location("pathname").then((pathname) => {
        const pageId = pathname.split("/")[3]?.split("-").pop();
        expect(pathname).to.be.equal(`/app/${appName}/page1-${pageId}/edit`);
      });
    });
  });

  it("3. Checks if page slug updates on the URL when page name changes", () => {
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Page1",
      action: "Edit name",
    });
    cy.get(explorer.editEntity).last().type("Page renamed", { force: true });
    cy.get("body").click(0, 0, { force: true });
    cy.wait("@updatePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.location("pathname").then((pathname) => {
      const pageId = pathname.split("/")[3]?.split("-").pop();
      expect(pathname).to.be.equal(
        `/app/${applicationName}/page-renamed-${pageId}/edit`,
      );
    });
  });

  it("4. Check the url of old applications, upgrades version and compares appsmith.URL values", () => {
    cy.request("PUT", `/api/v1/applications/${applicationId}`, {
      applicationVersion: 1,
    }).then((response) => {
      const application = response.body.data;
      expect(application.applicationVersion).to.equal(1);
      homePage.NavigateToHome();
      //agHelper.RefreshPage("getReleaseItems");

      cy.SearchApp(applicationName);

      cy.wait("@getPagesForCreateApp").then((intercept) => {
        const { application, pages } = intercept.response.body.data;
        const defaultPage = pages.find((p) => p.isDefault);

        cy.location().should((loc) => {
          expect(loc.pathname).includes(
            `/applications/${application.id}/pages/${defaultPage.id}`,
          );
        });

        cy.Createpage("NewPage");
        cy.get("@currentPageId").then((currentPageId) => {
          cy.location().should((loc) => {
            expect(loc.pathname).includes(
              `/applications/${application.id}/pages/${currentPageId}`,
            );
          });
          cy.get(explorer.addWidget).click();
          cy.dragAndDropToCanvas("textwidget", { x: 300, y: 700 });
          cy.get(".t--widget-textwidget").should("exist");
          cy.updateCodeInput(
            ".t--property-control-text",
            `{{appsmith.URL.pathname}}`,
          );

          cy.get(".t--draggable-textwidget .bp3-ui-text")
            .should(
              "contain.text",
              `/applications/${application.id}/pages/${currentPageId}/edit`,
            )
            .wait(2000);

          cy.get(".t--upgrade").click({ force: true });

          cy.get(".t--upgrade-confirm").click({ force: true });

          cy.wait("@getPagesForCreateApp").then((intercept) => {
            const { application, pages } = intercept.response.body.data;
            const currentPage = pages.find((p) => p.id === currentPageId);

            cy.location().should((loc) => {
              expect(loc.pathname).includes(
                `/app/${application.slug}/${currentPage.slug}-${currentPage.id}`,
              );
            });

            cy.get(".t--draggable-textwidget .bp3-ui-text").should(
              "contain.text",
              `/app/${application.slug}/${currentPage.slug}-${currentPage.id}/edit`,
            );

            cy.visit(
              `/${application.slug}/${currentPage.slug}-${currentPage.id}/edit`,
            );

            cy.location().should((loc) => {
              expect(loc.pathname).includes(
                `/app/${application.slug}/${currentPage.slug}-${currentPage.id}/edit`,
              );
            });
          });
        });
      });
    });
  });

  it("5. Checks redirect url", () => {
    cy.url().then((url) => {
      cy.LogOut();
      agHelper.VisitNAssert(url + "?embed=true&a=b", "signUpLogin");
      agHelper.Sleep(2000);
      // cy.location().should((loc) => {
      //   expect(loc.search).to.eq(
      //     `?redirectUrl=${encodeURIComponent(url + "?embed=true&a=b")}`,
      //   );
      // });
      agHelper.AssertURL(
        `?redirectUrl=${encodeURIComponent(url + "?embed=true&a=b")}`,
      );
    });
  });
});
