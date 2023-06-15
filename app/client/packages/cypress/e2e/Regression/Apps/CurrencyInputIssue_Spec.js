/// <reference types="Cypress" />
import { homePage, agHelper } from "../../../support/Objects/ObjectsCore";
import reconnectDatasourceModal from "../../../locators/ReconnectLocators";
const themelocators = require("../../../locators/ThemeLocators.json");

const widgetName = "currencyinputwidget";
const wiggetClass = `.t--widget-${widgetName}`;
const widgetInput = `${wiggetClass} input`;

describe("Currency Input Issue", function () {
  it("1. Import application json &should check that the widget input is not showing any error", function () {
    agHelper.VisitNAssert("/applications", "getReleaseItems");
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
        homePage.AssertImportToast();
      }
    });
    cy.get(widgetInput).type("123456789");
    cy.focused().then(() => {
      cy.get(themelocators.popover).should("not.exist");
    });
  });
});
