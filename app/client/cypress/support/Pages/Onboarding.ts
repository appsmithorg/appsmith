import { ObjectsRegistry } from "../Objects/Registry";

const OnboardingLocator = require("../../locators/FirstTimeUserOnboarding.json");

let datasourceName;
export class Onboarding {
  private _aggregateHelper = ObjectsRegistry.AggregateHelper;
  private _datasources = ObjectsRegistry.DataSources;

  completeSignposting() {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("be.visible");
    cy.get(OnboardingLocator.checklistStatus).should("contain", "0 of 5");
    cy.get(OnboardingLocator.checklistBack).click();

    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("not.be.disabled");
    cy.get(OnboardingLocator.checklistDatasourceBtn).click();
    cy.get(OnboardingLocator.datasourcePage).should("be.visible");
    if (Cypress.env("AIRGAPPED")) {
      this._datasources.CreateDataSource("Mongo");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
    } else {
      cy.get(OnboardingLocator.datasourceMock).first().click();
    }
    cy.wait(1000);
    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "1 of 5");
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("not.exist");
    cy.get(OnboardingLocator.checklistActionBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistActionBtn).click();
    cy.get(OnboardingLocator.createQuery).should("be.visible");
    cy.get(OnboardingLocator.createQuery).click();
    cy.wait(1000);
    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "2 of 5");
    cy.get(OnboardingLocator.checklistActionBtn).should("not.exist");
    cy.get(OnboardingLocator.checklistWidgetBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistWidgetBtn).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    (cy as any).dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "3 of 5");
    cy.get(OnboardingLocator.checklistWidgetBtn).should("not.exist");

    cy.get(OnboardingLocator.checklistConnectionBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistConnectionBtn).click();
    cy.get(OnboardingLocator.snipingBanner).should("be.visible");
    cy.get(OnboardingLocator.snipingTextWidget)
      .first()
      .trigger("mouseover", { force: true })
      .wait(500);
    cy.get(OnboardingLocator.widgetName).should("be.visible");
    cy.get(OnboardingLocator.widgetName).click();
    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "4 of 5");
    cy.get(OnboardingLocator.checklistConnectionBtn).should("not.exist");

    let open: any;
    cy.window().then((window: any) => {
      open = window.open;
      window.open = Cypress._.noop;
    });
    cy.get(OnboardingLocator.checklistDeployBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistDeployBtn).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "5 of 5");
    cy.get(OnboardingLocator.checklistDeployBtn).should("not.exist");
    cy.window().then((window) => {
      window.open = open;
    });
  }

  closeIntroModal() {
    cy.get("body").then(($body) => {
      if ($body.find(OnboardingLocator.introModalCloseBtn).length) {
        this._aggregateHelper.GetNClick(OnboardingLocator.introModalCloseBtn);
      }
    });
  }

  skipSignposting() {
    cy.get("body").then(($body) => {
      if ($body.find(OnboardingLocator.statusbarClose).length) {
        this._aggregateHelper.GetNClick(OnboardingLocator.statusbarClose);
      }
    });
  }
}
