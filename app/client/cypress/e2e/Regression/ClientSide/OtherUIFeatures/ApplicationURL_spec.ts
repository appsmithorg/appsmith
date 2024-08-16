import {
  agHelper,
  assertHelper,
  draggableWidgets,
  entityExplorer,
  homePage,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("Slug URLs", () => {
  let applicationName;
  let applicationId;

  it("1. Checks URL redirection from legacy URLs to slug URLs", () => {
    applicationId = localStorage.getItem("applicationId");
    cy.location("pathname").then((pathname) => {
      const pageId = agHelper.extractPageIdFromUrl(pathname);
      cy.visit(`/applications/${applicationId}/pages/${pageId}/edit`, {
        timeout: Cypress.config().pageLoadTimeout,
      }).then(() => {
        agHelper.WaitUntilEleAppear(locators._sidebar);
        cy.location("pathname").then((pathname) => {
          const pageId = agHelper.extractPageIdFromUrl(pathname);
          const appName = localStorage
            .getItem("appName")
            .replace(/\s+/g, "-")
            .toLowerCase();
          expect(pathname).to.be.equal(`/app/${appName}/page1-${pageId}/edit`);
        });
      });
    });
  });

  it("2. Checks if application slug updates & page slug updates on the URL when application name/page name changes", () => {
    cy.generateUUID().then((appName) => {
      applicationName = appName;
      homePage.RenameApplication(applicationName);
      cy.location("pathname").then((pathname) => {
        const pageId = agHelper.extractPageIdFromUrl(pathname);
        expect(pathname).to.be.equal(`/app/${appName}/page1-${pageId}/edit`);
      });
    });
    entityExplorer.RenameEntityFromExplorer(
      "Page1",
      "Renamed",
      false,
      EntityItems.Page,
    );
    assertHelper.AssertNetworkStatus("updatePage");
    // cy.location("pathname").then((pathname) => {
    cy.url().then((url) => {
      const urlObject = new URL(url);
      const pathname = urlObject.pathname;
      const pageId = agHelper.extractPageIdFromUrl(pathname);
      expect(pathname).to.be.equal(
        `/app/${applicationName}/renamed-${pageId}/edit`,
      );
    });
  });

  it("3. Check the url of old applications, upgrades version and compares appsmith.URL values", () => {
    cy.request("PUT", `/api/v1/applications/${applicationId}`, {
      applicationVersion: 1,
    }).then((response) => {
      const application = response.body.data;
      expect(application.applicationVersion).to.equal(1);
      homePage.NavigateToHome();

      cy.SearchApp(applicationName);

      cy.wait("@getConsolidatedData").then((intercept) => {
        const { application, pages } = intercept.response.body.data.pages.data;
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
          entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);

          propPane.UpdatePropertyFieldValue(
            "Text",
            "{{appsmith.URL.pathname}}",
          );

          cy.get(".t--draggable-textwidget .bp3-ui-text").should(
            "contain.text",
            `/applications/${application.id}/pages/${currentPageId}/edit`,
          );

          agHelper.GetNClick(".t--upgrade");

          agHelper.ClickButton("Update");

          assertHelper.AssertNetworkStatus("getConsolidatedData");

          cy.get("@getConsolidatedData").then((intercept) => {
            const { application, pages } =
              intercept.response.body.data.pages.data;

            const currentPage = pages.find((p) => p.id === currentPageId);

            cy.location().should((loc) => {
              expect(loc.pathname).includes(
                `/app/${application.slug}/${currentPage.slug}-${currentPage.id}`,
              );
            });
            agHelper.AssertElementVisibility(
              locators._widgetInCanvas(draggableWidgets.TEXT),
            );
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
            agHelper.AssertElementVisibility(
              locators._widgetInCanvas(draggableWidgets.TEXT),
            );
          });
        });
      });
    });
  });

  it("4. Checks redirect url", () => {
    cy.url().then((url) => {
      homePage.Signout(true);
      agHelper.VisitNAssert(url + "?embed=true&a=b"); //removing 'getConsolidatedData' api check due to its flakyness
      agHelper.AssertURL(
        `?redirectUrl=${encodeURIComponent(url + "?embed=true&a=b")}`,
      );
    });
  });
});
