import homePage from "../../../../locators/HomePage";

describe("Slug URLs", () => {
  let applicationName;
  it("Checks URL redirection from legacy URLs to slug URLs", () => {
    const applicationId = localStorage.getItem("applicationId");
    cy.location("pathname").then((pathname) => {
      const pageId = pathname
        .split("/")[2]
        ?.split("-")
        .pop();
      cy.visit(`/applications/${applicationId}/pages/${pageId}/edit`).then(
        () => {
          cy.wait(10000);
          cy.location("pathname").then((pathname) => {
            const pageId = pathname
              .split("/")[2]
              ?.split("-")
              .pop();
            const appName = localStorage.getItem("AppName");
            expect(pathname).to.be.equal(`/${appName}/page1-${pageId}/edit`);
          });
        },
      );
    });
  });

  it("Checks if application slug updates on the URL when application name changes", () => {
    cy.generateUUID().then((appName) => {
      applicationName = appName;
      cy.AppSetupForRename();
      cy.get(homePage.applicationName).type(`${appName}` + "{enter}");
      cy.wait("@updateApplication").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.location("pathname").then((pathname) => {
        const pageId = pathname
          .split("/")[2]
          ?.split("-")
          .pop();
        expect(pathname).to.be.equal(`/${appName}/page1-${pageId}/edit`);
      });
    });
  });

  it("Checks if page slug updates on the URL when page name changes", () => {
    cy.GlobalSearchEntity("Page1");
    cy.RenameEntity("Page renamed");
    cy.get("body").click(0, 0);
    cy.wait("@updatePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.location("pathname").then((pathname) => {
      const pageId = pathname
        .split("/")[2]
        ?.split("-")
        .pop();
      expect(pathname).to.be.equal(
        `/${applicationName}/page-renamed-${pageId}/edit`,
      );
    });
  });
});

describe("Checks update feature on old application", () => {
  it("Check the url of old applications and upgrades version", () => {
    cy.wait(4000);
    const applicationId = localStorage.getItem("applicationId");
    cy.request("PUT", `/api/v1/applications/${applicationId}`, {
      applicationVersion: 1,
    }).then((response) => {
      const application = response.body.data;
      expect(application.applicationVersion).to.equal(1);
      const applicationName = localStorage.getItem("AppName");
      cy.NavigateToHome();
      cy.reload();

      cy.SearchApp(applicationName);

      cy.wait("@getPagesForCreateApp").then((intercept) => {
        const { application, pages } = intercept.response.body.data;
        const defaultPage = pages.find((p) => p.isDefault);

        cy.location().should((loc) => {
          expect(loc.pathname).includes(
            `/applications/${application.id}/pages/${defaultPage.id}`,
          );
        });

        cy.get(".t--upgrade").click({ force: true });

        cy.get(".t--upgrade-confirm").click({ force: true });

        cy.wait("@getPagesForCreateApp").then((intercept) => {
          const { application, pages } = intercept.response.body.data;
          const defaultPage = pages.find((p) => p.isDefault);

          cy.location().should((loc) => {
            expect(loc.pathname).includes(
              `/${application.slug}/${defaultPage.slug}-${defaultPage.id}`,
            );
          });
        });
      });
    });
  });
});
