import homePage from "../../../../locators/HomePage";
const explorer = require("../../../../locators/explorerlocators.json");
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
    // cy.RenameEntity("Page renamed");
    cy.get(`.t--entity-item:contains(Page1)`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });
    cy.selectAction("Edit Name");
    cy.get(explorer.editEntity)
      .last()
      .type("Page renamed", { force: true });
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
