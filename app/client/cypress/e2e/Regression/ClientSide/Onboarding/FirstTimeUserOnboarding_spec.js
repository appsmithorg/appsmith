const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
import {
  agHelper,
  locators,
  entityExplorer,
  homePage,
  onboarding,
  draggableWidgets,
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
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(OnboardingLocator.introModal).should("not.exist");
    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
  });

  it(
    "excludeForAirgap",
    "2. onboarding flow - should check the checklist page actions",
    function () {
      agHelper.GetNClick(OnboardingLocator.introModalBuild);
      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "0 of 5");
      agHelper.GetNClick(OnboardingLocator.checklistBack);
      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.AssertElementEnabledDisabled(
        OnboardingLocator.checklistDatasourceBtn,
        0,
        false,
      );
      agHelper.GetNClick(OnboardingLocator.checklistDatasourceBtn);
      agHelper.AssertElementVisible(OnboardingLocator.datasourcePage);

      agHelper.GetNClick(OnboardingLocator.datasourceMock);

      agHelper.Sleep();
      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "1 of 5");
      agHelper.AssertElementAbsence(OnboardingLocator.checklistDatasourceBtn);
      agHelper.GetNClick(OnboardingLocator.checklistActionBtn);
      agHelper.GetNClick(OnboardingLocator.createQuery);

      agHelper.Sleep();
      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "2 of 5");
      agHelper.AssertElementAbsence(OnboardingLocator.checklistActionBtn);
      agHelper.GetNClick(OnboardingLocator.checklistWidgetBtn);
      agHelper.AssertElementVisible(OnboardingLocator.widgetSidebar);

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);

      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "3 of 5");
      agHelper.AssertElementAbsence(OnboardingLocator.checklistWidgetBtn);
      agHelper.GetNClick(OnboardingLocator.checklistConnectionBtn);

      agHelper.AssertElementVisible(OnboardingLocator.snipingBanner);

      cy.get(OnboardingLocator.snipingTextWidget)
        .first()
        .trigger("mouseover", { force: true })
        .wait(500);
      agHelper.GetNClick(OnboardingLocator.widgetName);

      agHelper.GetNClick(OnboardingLocator.statusbar);
      agHelper.GetNAssertContains(OnboardingLocator.checklistStatus, "4 of 5");
      agHelper.AssertElementAbsence(OnboardingLocator.checklistConnectionBtn);

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
      cy.get(OnboardingLocator.introModalBuild).click();

      cy.get(OnboardingLocator.statusbar).click();
      cy.get(OnboardingLocator.checklistStatus).should("be.visible");
      cy.get(OnboardingLocator.checklistStatus).should("contain", "0 of 5");
      cy.get(OnboardingLocator.checklistBack).click();

      cy.get(OnboardingLocator.statusbar).click();
      cy.get(OnboardingLocator.checklistDatasourceBtn).should(
        "not.be.disabled",
      );
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
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
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

  it(
    "excludeForAirgap",
    "3. onboarding flow - should check the tasks page actions",
    function () {
      cy.get(OnboardingLocator.introModalBuild).click();

      cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_DATASOURCE_HEADER(),
      );
      cy.get(OnboardingLocator.taskDatasourceBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(OnboardingLocator.datasourceMock).first().click();
      cy.wait(1000);
      cy.get(OnboardingLocator.datasourceBackBtn).click();
      cy.get(OnboardingLocator.taskDatasourceBtn).should("not.exist");

      cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_QUERY_HEADER(),
      );
      cy.get(OnboardingLocator.taskActionBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(OnboardingLocator.createQuery).first().click();
      cy.wait(1000);
      cy.get(OnboardingLocator.statusbar).click();
      cy.get(OnboardingLocator.checklistBack).click();
      cy.get(OnboardingLocator.taskActionBtn).should("not.exist");

      cy.get(OnboardingLocator.taskWidgetBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_WIDGET_HEADER(),
      );
      cy.get(OnboardingLocator.taskWidgetBtn).click();
      cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
      cy.get(OnboardingLocator.dropTarget).should("be.visible");
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(OnboardingLocator.textWidgetName).should("be.visible");
      cy.get(OnboardingLocator.taskWidgetBtn).should("not.exist");
    },
  );

  it(
    "airgap",
    "3. onboarding flow - should check the tasks page actions - airgap",
    function () {
      cy.get(OnboardingLocator.introModalBuild).click();

      cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_DATASOURCE_HEADER(),
      );
      cy.get(OnboardingLocator.taskDatasourceBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(datasource.MongoDB).click();
      cy.fillMongoDatasourceForm();
      cy.generateUUID().then((uid) => {
        datasourceName = `Mongo CRUD ds ${uid}`;
        cy.renameDatasource(datasourceName);
      });
      cy.testSaveDatasource();
      cy.wait(1000);
      cy.get(".t--close-editor").click();
      cy.wait(1000);
      cy.get(OnboardingLocator.datasourceBackBtn).click();
      cy.get(OnboardingLocator.taskDatasourceBtn).should("not.exist");

      cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_QUERY_HEADER(),
      );
      cy.get(OnboardingLocator.taskActionBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(OnboardingLocator.createQuery).first().click();
      cy.wait(1000);
      cy.get(OnboardingLocator.statusbar).click();
      cy.get(OnboardingLocator.checklistBack).click();
      cy.get(OnboardingLocator.taskActionBtn).should("not.exist");

      cy.get(OnboardingLocator.taskWidgetBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceHeader).contains(
        Cypress.env("MESSAGES").ONBOARDING_TASK_WIDGET_HEADER(),
      );
      cy.get(OnboardingLocator.taskWidgetBtn).click();
      cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
      cy.get(OnboardingLocator.dropTarget).should("be.visible");
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(OnboardingLocator.textWidgetName).should("be.visible");
      cy.get(OnboardingLocator.taskWidgetBtn).should("not.exist");
    },
  );

  it("4. onboarding flow - should check the tasks page datasource action alternate widget action", function () {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
    cy.get(OnboardingLocator.taskDatasourceAltBtn).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });

  it(
    "airgap",
    "5. onboarding flow - should check the tasks page query action alternate widget action - airgap",
    function () {
      cy.get(OnboardingLocator.introModalBuild).click();

      cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(datasource.MongoDB).click();
      cy.fillMongoDatasourceForm();
      cy.generateUUID().then((uid) => {
        datasourceName = `Mongo CRUD ds ${uid}`;
        cy.renameDatasource(datasourceName);
      });
      cy.testSaveDatasource();
      cy.wait(1000);
      cy.get(".t--close-editor").click();
      cy.wait(1000);
      cy.get(OnboardingLocator.datasourceBackBtn).click();

      cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
      cy.get(OnboardingLocator.taskActionAltBtn).click();
      cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
      cy.get(OnboardingLocator.dropTarget).should("be.visible");
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(OnboardingLocator.textWidgetName).should("be.visible");
    },
  );

  it(
    "excludeForAirgap",
    "5. onboarding flow - should check the tasks page query action alternate widget action",
    function () {
      cy.get(OnboardingLocator.introModalBuild).click();

      cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
      cy.get(OnboardingLocator.taskDatasourceBtn).click();
      cy.get(OnboardingLocator.datasourcePage).should("be.visible");
      cy.get(OnboardingLocator.datasourceMock).first().click();
      cy.wait(1000);
      cy.get(OnboardingLocator.datasourceBackBtn).click();

      cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
      cy.get(OnboardingLocator.taskActionAltBtn).click();
      cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
      cy.get(OnboardingLocator.dropTarget).should("be.visible");
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(OnboardingLocator.textWidgetName).should("be.visible");
    },
  );

  it("6. onboarding flow - should check directly opening widget pane", function () {
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
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
    cy.get(OnboardingLocator.statusbar).should("be.visible");
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });

  it("7. onboarding flow - new apps created should start with signposting", function () {
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");

    homePage.NavigateToHome();
    homePage.CreateNewApplication(false);

    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
  });

  it("8. onboarding flow - once signposting is completed new apps won't start with signposting", function () {
    onboarding.completeSignposting();

    homePage.NavigateToHome();
    agHelper.RefreshPage();
    homePage.CreateNewApplication(false);

    agHelper.AssertElementExist(locators._dropHere);
    agHelper.AssertElementAbsence(OnboardingLocator.statusbar);
  });
});
