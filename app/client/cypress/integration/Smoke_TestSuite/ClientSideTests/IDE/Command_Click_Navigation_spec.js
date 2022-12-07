import reconnectDatasourceModal from "../../../../locators/ReconnectLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { PROPERTY_SELECTOR } from "../../../../locators/WidgetLocators";

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;
const commonLocators = ObjectsRegistry.CommonLocators;

const NAVIGATION_ATTRIBUTE = "data-navigate-to";

describe("1. CommandClickNavigation", function() {
  it("1. Import the test application", () => {
    homePage.NavigateToHome();
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    cy.reload();
    homePage.ImportApp("ContextSwitching.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        homePage.AssertImportToast();
      }
    });
  });

  it("2. Assert link and and style", () => {
    cy.CheckAndUnfoldEntityItem("Queries/JS");

    cy.SearchEntityandOpen("Text1");
    cy.updateCodeInput(".t--property-control-text", "{{ Graphql_Query.data }}");

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`)
      .should("have.length", 1)
      .should("have.text", "Graphql_Query")
      .realHover()
      .should("have.css", "cursor", "text");

    // TODO how to hover with cmd or ctrl to assert pointer?
  });

  it("3. Assert navigation only when cmd or ctrl is pressed", () => {
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click();

    cy.url().should("not.contain", "/api/");

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Graphql_Query"]`).click({
      ctrlKey: true,
    });

    cy.url().should("contain", "/api/");
  });

  it("4. Assert working on url field", () => {
    cy.updateCodeInput(
      ".t--dataSourceField",
      "https://www.test.com/{{ SQL_Query.data }}",
    );

    cy.get(`[${NAVIGATION_ATTRIBUTE}="SQL_Query"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });

    cy.url().should("contain", "/queries/");
  });

  it("5. Will open modals", () => {
    cy.updateCodeInput(
      ".t--actionConfiguration\\.body",
      "SELECT * from {{ Button3.text }}",
    );
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Button3"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });

    cy.url().should("not.contain", "/queries/");
  });

  it("6. Will close modals", () => {
    cy.updateCodeInput(
      `${commonLocators._propertyControl}text`,
      "{{ Image1.image }}",
    );

    cy.get(`[${NAVIGATION_ATTRIBUTE}="Image1"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });
  });

  it.skip("7. Will work with string arguments in framework functions", () => {
    cy.get(PROPERTY_SELECTOR.onClick)
      .find(".t--js-toggle")
      .click();
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      "{{ resetWidget('Input1') }}",
    );
    cy.get(`[${NAVIGATION_ATTRIBUTE}="Input1"]`)
      .should("have.length", 1)
      .click({ cmdKey: true });
  });
});
