/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../support/Objects/Registry";
import reconnectDatasourceModal from "../../../locators/ReconnectLocators";

let homePage = ObjectsRegistry.HomePage,
  agHelper = ObjectsRegistry.AggregateHelper;

const widgetName = "currencyinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Currency Input Issue", function() {
  before(function() {
    agHelper.ClearLocalStorageCache();
  });

  beforeEach(function() {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(function() {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Import application json", function() {
    cy.visit("/applications");
    homePage.ImportApp("CurrencyInputIssueExport.json");
    cy.wait("@importNewApplication").then((interception) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
          force: true,
        });
        cy.wait(2000);
      } else {
        homePage.AssertImport();
      }
    });
  });

  it("2. Should check that widget input show any errors", function() {
    cy.get(widgetInput).type("123456789");
    cy.get(".bp3-popover-content").should("not.exist");
  });
});
