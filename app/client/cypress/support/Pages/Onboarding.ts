import { ObjectsRegistry } from "../Objects/Registry";
import localForage from "localforage";

const OnboardingLocator = require("../../locators/FirstTimeUserOnboarding.json");

let datasourceName;
export class Onboarding {
  private _aggregateHelper = ObjectsRegistry.AggregateHelper;
  private _datasources = ObjectsRegistry.DataSources;
  private _debuggerHelper = ObjectsRegistry.DebuggerHelper;

  public readonly locators = {
    back_to_canvas: "#back-to-canvas",
    deploy: "#application-publish-btn",
    table_widget_card: "#widget-card-draggable-tablewidgetv2",
    create_query: "#create-query",
    explorer_widget_tab: `#explorer-tab-options [data-value*="widgets"]`,
    add_datasources: "#add_datasources",
    connect_data_overlay: "#table-overlay-connectdata",
    skipStartFromData: "[data-testid='t--create-new-app-option-skip']",
    seeMoreButtonOnCanvas: `[data-testid="t--canvas-building-block-see-more"]`,
  };

  completeSignposting() {
    cy.get(OnboardingLocator.checklistStatus).should("be.visible");
    cy.get(OnboardingLocator.checklistStatus).should("contain", "0 of 5");

    this._aggregateHelper
      .GetElement(OnboardingLocator.checklistConnectionBtn)
      .realHover()
      .should("have.css", "cursor", "not-allowed");
    this._aggregateHelper.GetHoverNClick(
      OnboardingLocator.checklistDatasourceBtn,
      0,
      true,
    );
    this._aggregateHelper.AssertElementVisibility(
      this._datasources._newDatasourceContainer,
    );
    this.closeIntroModal();
    this._aggregateHelper.AssertElementAbsence(
      OnboardingLocator.introModal,
      10000,
    );
    if (Cypress.env("AIRGAPPED")) {
      this._datasources.CreateDataSource("Mongo");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
    } else {
      cy.get(OnboardingLocator.datasourceMock).first().click();
    }
    cy.wait(1000);
    this._aggregateHelper.GetNClick(this._debuggerHelper.locators._helpButton);
    cy.get(OnboardingLocator.checklistStatus).should("contain", "1 of 5");
    this._aggregateHelper
      .GetElement(OnboardingLocator.checklistConnectionBtn)
      .realHover()
      .should("have.css", "cursor", "not-allowed");
    cy.get(OnboardingLocator.checklistActionBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistActionBtn).click();
    this._datasources.CreateQueryForDS("Movies");
    cy.wait(1000);
    this._aggregateHelper.GetNClick(this._debuggerHelper.locators._helpButton);
    cy.get(OnboardingLocator.checklistStatus).should("contain", "2 of 5");
    this._aggregateHelper
      .GetElement(OnboardingLocator.checklistActionBtn)
      .realHover()
      .should("have.css", "cursor", "auto");
    cy.get(OnboardingLocator.checklistWidgetBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistWidgetBtn).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    (cy as any).dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    this._aggregateHelper.GetNClick(this._debuggerHelper.locators._helpButton);
    cy.get(OnboardingLocator.checklistStatus).should("contain", "3 of 5");
    this._aggregateHelper
      .GetElement(OnboardingLocator.checklistWidgetBtn)
      .realHover()
      .should("have.css", "cursor", "auto");

    cy.get(OnboardingLocator.checklistConnectionBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistConnectionBtn).click();
    cy.get(OnboardingLocator.snipingBanner).should("be.visible");
    cy.get(OnboardingLocator.snipingTextWidget)
      .first()
      .trigger("mouseover", { force: true })
      .wait(500);
    cy.get(OnboardingLocator.widgetName).should("be.visible");
    cy.get(OnboardingLocator.widgetName).click();
    this._aggregateHelper.GetNClick(this._debuggerHelper.locators._helpButton);
    cy.get(OnboardingLocator.checklistStatus).should("contain", "4 of 5");
    this._aggregateHelper
      .GetElement(OnboardingLocator.checklistConnectionBtn)
      .realHover()
      .should("have.css", "cursor", "auto");

    let open: any;
    cy.window().then((window: any) => {
      open = window.open;
      window.open = Cypress._.noop;
    });
    cy.get(OnboardingLocator.checklistDeployBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistDeployBtn).click();
    this._aggregateHelper.AssertElementAbsence(OnboardingLocator.introModal);
    this._aggregateHelper.Sleep();

    this._aggregateHelper.GetNClick(this._debuggerHelper.locators._helpButton);
    this._aggregateHelper.AssertElementExist(
      OnboardingLocator.checklistCompletionBanner,
    );
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
      if ($body.find(OnboardingLocator.introModalCloseBtn).length) {
        cy.wrap(null).then(async () => {
          localForage.config({
            name: "Appsmith",
          });
          // return a promise to cy.then() that
          // is awaited until it resolves
          return localForage.setItem("ENABLE_START_SIGNPOSTING", false);
        });
        //this._aggregateHelper.RefreshPage();//this is causing CI flakiness, so using below
        cy.window().then((win) => {
          win.location.reload();
        });
      }
    });
  }
}
