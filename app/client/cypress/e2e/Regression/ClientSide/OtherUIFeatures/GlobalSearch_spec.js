/* eslint-disable cypress/no-unnecessary-waiting */
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/MultipleWidgetDsl.json");
const globalSearchLocators = require("../../../../locators/GlobalSearch.json");
const datasourceHomeLocators = require("../../../../locators/apiWidgetslocator.json");
const datasourceLocators = require("../../../../locators/DatasourcesEditor.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("GlobalSearch", { tags: ["@tag.Sanity"] }, function () {
  before(() => {
    _.agHelper.AddDsl("MultipleWidgetDsl");
  });

  beforeEach(() => {
    _.dataSources.StartDataSourceRoutes();
  });

  it("1. Shows And Hides Using Keyboard Shortcuts", () => {
    // wait for the page to load
    cy.get(commonlocators.canvas);
    const isMac = Cypress.platform === "darwin";
    if (isMac) {
      cy.get("body").type("{cmd}{k}");
      cy.get(commonlocators.globalSearchModal);
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    } else {
      cy.get("body").type("{ctrl}{k}");
      cy.get(commonlocators.globalSearchModal);
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    }
  });

  it("2. selectsWidget", () => {
    const table = dsl.dsl.children[2];
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(commonlocators.globalSearchInput).type(table.widgetName);
    cy.get("body").type("{enter}");
    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { lastSelectedWidget } = state.ui.widgetDragResize;
        expect(lastSelectedWidget).to.be.equal(table.widgetId);
      });
  });

  it("3. navigatesToApi", () => {
    cy.CreateAPI("SomeApi");
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(commonlocators.globalSearchInput).type("Page1");
    cy.get("body").type("{enter}");

    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(commonlocators.globalSearchInput).type("SomeApi");
    cy.get("body").type("{enter}");
    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { actions } = state.entities;
        const expectedAction = actions.find(
          (actions) => actions.config.name === "SomeApi",
        );
        cy.location().should((loc) => {
          expect(loc.pathname).includes(expectedAction.config.id);
        });
      });
  });

  it("4. navigatesToDatasourceHavingAQuery", () => {
    cy.createPostgresDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      const expectedDatasource = httpResponse.response.body.data;
      _.dataSources.CreateQueryAfterDSSaved();
      cy.get(commonlocators.globalSearchTrigger).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000); // modal open transition should be deterministic
      cy.get(commonlocators.globalSearchInput).type("Page1");
      cy.get("body").type("{enter}");

      cy.get(commonlocators.globalSearchTrigger).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000); // modal open transition should be deterministic
      cy.get(commonlocators.globalSearchInput).type(expectedDatasource.name);
      cy.get("body").type("{enter}");
      cy.location().should((loc) => {
        expect(loc.pathname).includes(expectedDatasource.id);
      });
    });
  });

  it("5. navigatesToPage", () => {
    cy.Createpage("NewPage");
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(commonlocators.globalSearchInput).type("Page1");
    cy.get("body").type("{enter}");
    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { pages } = state.entities.pageList;
        const expectedPage = pages.find((page) => page.pageName === "Page1");
        cy.location().should((loc) => {
          expect(loc.pathname).includes(expectedPage.pageId);
        });
      });
  });

  it("6. Shortcuts should get triggered when the modal is open", () => {
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    const isMac = Cypress.platform === "darwin";
    if (isMac) {
      cy.get("body").type("{cmd}{p}");
      cy.get(globalSearchLocators.category).should("be.visible");
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    } else {
      cy.get("body").type("{ctrl}{p}");
      cy.get(globalSearchLocators.category).should("be.visible");
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    }
  });

  it("7. Api actions should have API as prefix", () => {
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    PageLeftPane.switchToAddNew();
    cy.get(globalSearchLocators.blankDatasource).first().click({ force: true });
    cy.get(datasourceHomeLocators.createAuthApiDatasource).click();
    cy.get(datasourceLocators.datasourceTitleLocator).click();
    _.agHelper.RenameQuery("omnibarApiDatasource");

    cy.fillAuthenticatedAPIForm();
    cy.saveDatasource();

    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
    PageLeftPane.switchToAddNew();
    cy.get(".ads-v2-listitem span:contains('omnibarApiDatasource')")
      .first()
      .click();
    cy.wait("@createNewApi");
    cy.get(datasourceHomeLocators.apiTxt)
      .invoke("val")
      .then((title) => expect(title).includes("Api"));
  });

  // since now datasource will only be saved once user clicks on save button explicitly,
  // updated test so that when user clicks on google sheet and searches for the same datasource, no
  // results found will be shown
  it(
    "8. navigatesToGoogleSheetsQuery does not break again: Bug 15012",
    { tags: ["@tag.excludeForAirgap"] },
    () => {
      cy.createGoogleSheetsDatasource();
      cy.renameDatasource("XYZ");
      cy.wait(4000);

      cy.get(commonlocators.globalSearchTrigger).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000); // modal open transition should be deterministic
      cy.get(commonlocators.globalSearchInput).type("XYZ");

      cy.get(".no-data-title").should("be.visible");
    },
  );
});
