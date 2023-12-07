import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
import {
  agHelper,
  locators,
  entityExplorer,
  homePage,
  onboarding,
  draggableWidgets,
  debuggerHelper,
  dataSources,
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
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
  });

  it(
    "excludeForAirgap",
    "2. onboarding flow - should check the checklist actions",
    function () {
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "0 of 5");
      agHelper.AssertElementExist(OnboardingLocator.checklistDatasourceBtn);
      agHelper.GetNClick(OnboardingLocator.checklistDatasourceBtn);
      agHelper.AssertElementVisibility(dataSources._newDatasourceContainer);

      agHelper.GetNClick(OnboardingLocator.datasourceMock);

      agHelper.Sleep();
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "1 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistDatasourceBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistActionBtn);
      dataSources.CreateQueryForDS("Movies");

      agHelper.Sleep();
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "2 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistActionBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistWidgetBtn);
      agHelper.AssertElementVisibility(OnboardingLocator.widgetSidebar);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);

      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "3 of 5");
      agHelper
        .GetElement(OnboardingLocator.checklistWidgetBtn)
        .realHover()
        .should("have.css", "cursor", "auto");
      agHelper.GetNClick(OnboardingLocator.checklistConnectionBtn);

      agHelper.AssertElementVisibility(OnboardingLocator.snipingBanner);

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
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.AssertElementExist(OnboardingLocator.checklistCompletionBanner);
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

      agHelper
        .GetElement(OnboardingLocator.checklistDatasourceBtn)
        .realHover()
        .should("have.css", "cursor", "pointer");

      cy.get(OnboardingLocator.checklistDatasourceBtn).click();
      cy.get(dataSources._newDatasourceContainer).should("be.visible");
      cy.get(datasource.MongoDB).click();
      dataSources.FillMongoDSForm();
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
      dataSources.CreateQueryAfterDSSaved();
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
      agHelper.GetNClick(debuggerHelper.locators._helpButton);
      agHelper.AssertElementExist(OnboardingLocator.checklistCompletionBanner);
      agHelper.AssertElementAbsence(OnboardingLocator.checklistDeployBtn);
      cy.window().then((window) => {
        window.open = open;
      });
    },
  );

  it("3. onboarding flow - should check directly opening widget pane", function () {
    agHelper.AssertElementVisibility(OnboardingLocator.checklistDatasourceBtn);
    agHelper.GetNClick(OnboardingLocator.introModalCloseBtn);
    PageLeftPane.switchSegment(PagePaneSegment.Widgets);
    agHelper.AssertElementVisibility(OnboardingLocator.widgetSidebar);
    agHelper.AssertElementVisibility(OnboardingLocator.dropTarget);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
    agHelper.RefreshPage("getPage");
    agHelper.AssertElementEnabledDisabled(
      debuggerHelper.locators._helpButton,
      0,
      false,
    );
    agHelper.Sleep(500);
    agHelper.GetNClick(debuggerHelper.locators._helpButton);
    agHelper.AssertElementVisibility(OnboardingLocator.introModal);
    agHelper.AssertElementVisibility(OnboardingLocator.textWidgetName);
  });

  it("4. onboarding flow - new apps created should start with signposting", function () {
    agHelper.AssertElementVisibility(OnboardingLocator.checklistDatasourceBtn);
    agHelper.GetNClick(OnboardingLocator.introModalCloseBtn);
    homePage.NavigateToHome();
    homePage.CreateNewApplication(false);
    agHelper.AssertElementVisibility(locators._dropHere);
    agHelper.AssertElementEnabledDisabled(
      debuggerHelper.locators._helpButton,
      0,
      false,
    );
    agHelper.Sleep(500);
    agHelper.GetNClick(debuggerHelper.locators._helpButton, 0, true);
    agHelper.AssertElementVisibility(OnboardingLocator.checklistDatasourceBtn);
  });

  it("5. onboarding flow - once signposting is completed new apps won't start with signposting", function () {
    onboarding.completeSignposting();

    homePage.NavigateToHome();
    agHelper.RefreshPage();
    homePage.CreateNewApplication(false);

    agHelper.AssertElementExist(locators._dropHere);
    agHelper.AssertElementEnabledDisabled(
      debuggerHelper.locators._helpButton,
      0,
      false,
    );
    agHelper.Sleep(1500);
    agHelper.GetNClick(debuggerHelper.locators._helpButton);
    agHelper.AssertElementAbsence(OnboardingLocator.introModal);
  });
});
