/* eslint-disable cypress/no-unnecessary-waiting */
const commonlocators = require("../../../../locators/commonlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/MultipleWidgetDsl.json");

describe("GlobalSearch", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("showsAndHidesUsingKeyboardShortcuts", () => {
    const isMac = Cypress.platform === "darwin";
    if (isMac) {
      cy.wait(2000);
      cy.get("body").type("{cmd}{k}");
      cy.get(commonlocators.globalSearchModal);
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    } else {
      cy.wait(2000);
      cy.get("body").type("{ctrl}{k}");
      cy.get(commonlocators.globalSearchModal);
      cy.get("body").type("{esc}");
      cy.get(commonlocators.globalSearchModal).should("not.exist");
    }
  });

  it("selectsWidget", () => {
    const table = dsl.dsl.children[2];
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.globalSearchInput).type(table.widgetName);
    cy.get("body").type("{enter}");
    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { selectedWidget } = state.ui.widgetDragResize;
        expect(selectedWidget).to.be.equal(table.widgetId);
      });
  });

  it("navigatesToApi", () => {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("SomeApi");

    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.globalSearchClearInput).click({ force: true });
    cy.get(commonlocators.globalSearchInput).type("Page1");
    cy.get("body").type("{enter}");

    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.globalSearchClearInput).click({ force: true });
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

  it("navigatesToDatasourceHavingAQuery", () => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      const expectedDatasource = httpResponse.response.body.data;
      cy.NavigateToQueryEditor();
      cy.contains(".t--datasource-name", expectedDatasource.name)
        .find(queryLocators.createQuery)
        .click();

      cy.get(commonlocators.globalSearchTrigger).click({ force: true });
      cy.wait(1000); // modal open transition should be deterministic
      cy.get(commonlocators.globalSearchClearInput).click({ force: true });
      cy.get(commonlocators.globalSearchInput).type("Page1");
      cy.get("body").type("{enter}");

      cy.get(commonlocators.globalSearchTrigger).click({ force: true });
      cy.wait(1000); // modal open transition should be deterministic
      cy.get(commonlocators.globalSearchClearInput).click({ force: true });
      cy.get(commonlocators.globalSearchInput).type(expectedDatasource.name);
      cy.get("body").type("{enter}");
      cy.location().should((loc) => {
        expect(loc.pathname).includes(expectedDatasource.id);
      });
    });
  });

  it("navigatesToPage", () => {
    cy.Createpage("NewPage");
    cy.get(commonlocators.globalSearchTrigger).click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.globalSearchClearInput).click({ force: true });
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
});
