/* eslint-disable cypress/no-unnecessary-waiting */
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/MultipleWidgetDsl.json");
const globalSearchLocators = require("../../../../locators/GlobalSearch.json");

describe("GlobalSearch", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Clicking on filter should show the filter menu", () => {
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    cy.contains(globalSearchLocators.docHint, "Snippets").click();
    cy.get(globalSearchLocators.filterButton).click();
    cy.contains("Reset Filter").should("be.visible");
    cy.get("body").type("{esc}");
  });

  it("1. showsAndHidesUsingKeyboardShortcuts", () => {
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
    cy.NavigateToAPI_Panel();
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
    cy.get("@createDatasource").then((httpResponse) => {
      const expectedDatasource = httpResponse.response.body.data;

      cy.NavigateToActiveDSQueryPane(expectedDatasource.name);
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
    cy.NavigateToHome();
  });
});
