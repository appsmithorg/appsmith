const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
import {
  agHelper,
  locators,
  entityExplorer,
  homePage,
  onboarding,
  draggableWidgets,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";
const datasource = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;
describe("FirstTimeUserOnboarding", function () {
  beforeEach(() => {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
  });

  it("1. onboarding flow - should check page entity selection in explorer", function () {
    cy.get(OnboardingLocator.introModal).should("be.visible");
    cy.get(OnboardingLocator.checklistDatasourceBtn).click();
    cy.get(OnboardingLocator.introModal).should("not.exist");
    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
  });

  it(
    "excludeForAirgap",
    "2. onboarding flow - should check the checklist actions",
    function () {
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "0 of 5");
      agHelper.AssertElementExist(OnboardingLocator.checklistDatasourceBtn);
      agHelper.GetNClick(OnboardingLocator.checklistDatasourceBtn);
      agHelper.AssertElementVisible(OnboardingLocator.datasourcePage);

      agHelper.GetNClick(OnboardingLocator.datasourceMock);

      agHelper.Sleep();
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "1 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistDatasourceBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistActionBtn);
      agHelper.GetNClick(OnboardingLocator.createQuery);

      agHelper.Sleep();
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "2 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistActionBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistWidgetBtn);
      agHelper.AssertElementVisible(OnboardingLocator.widgetSidebar);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);

      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "3 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistWidgetBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistConnectionBtn);

      agHelper.AssertElementVisible(OnboardingLocator.snipingBanner);

      cy.get(OnboardingLocator.snipingTextWidget)
        .first()
        .trigger("mouseover", { force: true })
        .wait(500);
      agHelper.GetNClick(OnboardingLocator.widgetName);

      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "4 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistConnectionBtn)
        .realHover()
        .should("have.css", "cursor", "auto");

      let open;
      cy.window().then((window) => {
        open = window.open;
        window.open = Cypress._.noop;
      });

      agHelper.GetNClick(OnboardingLocator.checklistDeployBtn);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "5 of 5");
      agHelper.AssertElementAbsence(OnboardingLocator.checklistDeployBtn);

      cy.window().then((window) => {
        window.open = open;
      });
    },
  );

  it(
    "airgap",
    "2. onboarding flow - should check the checklist page actions - airgap",
    function () {
      cy.get(OnboardingLocator.introModal).should("be.visible");

      cy.get(OnboardingLocator.checklistStatus).should("be.visible");
      cy.get(OnboardingLocator.checklistStatus).should("contain", "0 of 5");

      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper
        .GetElement(OnboardingLocator.checklistDatasourceBtn)
        .realHover()
        .should("have.css", "cursor", "pointer");

      cy.get(OnboardingLocator.checklistDatasourceBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(datasource.MongoDB).click();
      cy.fillMongoDatasourceForm();
      cy.generateUUID().then((uid) => {
        datasourceName = `Mongo CRUD ds ${uid}`;
        cy.renameDatasource(datasourceName);
      });
      cy.testSaveDatasource();
      cy.wait(1000);
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      cy.get(OnboardingLocator.checklistStatus).should("contain", "1 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistDatasourceBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      cy.get(OnboardingLocator.checklistActionBtn).should("be.visible");
      cy.get(OnboardingLocator.checklistActionBtn).click();
      cy.get(OnboardingLocator.createQuery).should("be.visible");
      cy.get(OnboardingLocator.createQuery).click();
      cy.wait(1000);
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      cy.get(OnboardingLocator.checklistStatus).should("contain", "2 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistActionBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      cy.get(OnboardingLocator.checklistWidgetBtn).should("be.visible");
      cy.get(OnboardingLocator.checklistWidgetBtn).click();
      cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      cy.get(OnboardingLocator.checklistStatus).should("contain", "3 of 5");
      agHelper
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
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      cy.get(OnboardingLocator.checklistStatus).should("contain", "4 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistConnectionBtn)
        .realHover()
        .should("have.css", "cursor", "auto");

      let open;
      cy.window().then((window) => {
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
    },
  );

  it("3. onboarding flow - should check directly opening widget pane", function () {
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("be.visible");
    entityExplorer.NavigateToSwitcher("Widgets");
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.textWidgetName).should("be.visible").wait(800);
    cy.reload();
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    agHelper.GetNClick(debuggerHelper.locators._helpButton);
    agHelper.AssertElementVisible(OnboardingLocator.introModal);
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });

  it("4. onboarding flow - new apps created should start with signposting", function () {
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("be.visible");

    homePage.NavigateToHome();
    homePage.CreateNewApplication(false);

    agHelper.GetNClick(debuggerHelper.locators._helpButton);
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("be.visible");
  });

  it("5. onboarding flow - once signposting is completed new apps won't start with signposting", function () {
    onboarding.completeSignposting();

    homePage.NavigateToHome();
    agHelper.RefreshPage();
    homePage.CreateNewApplication(false);

    agHelper.AssertElementExist(locators._dropHere);
    agHelper.GetNClick(debuggerHelper.locators._helpButton);
    agHelper.AssertElementAbsence(OnboardingLocator.introModal);
  });
});
