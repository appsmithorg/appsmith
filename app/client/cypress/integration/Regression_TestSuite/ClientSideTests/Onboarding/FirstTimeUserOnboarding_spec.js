const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
const _ = require("lodash");

describe("FirstTimeUserOnboarding", function() {
  beforeEach(() => {
    cy.generateUUID().then((uid) => {
      cy.Signup(`${uid}@appsmithtest.com`, uid);
    });
  });

  it("onboarding flow - should check page entitiy selection in explorer", function() {
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
  });

  it("onboarding flow - should check check the redirection post signup", function() {
    cy.get(OnboardingLocator.introModal).should("be.visible");
  });

  it("onboarding flow - should check function of introduction modal build button", function() {
    cy.get(OnboardingLocator.introModal).should("be.visible");
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(OnboardingLocator.introModal).should("not.exist");
  });

  it("onboarding flow - should check function of introduction modal guided tour button", function() {
    cy.get(OnboardingLocator.introModalWelcomeTourBtn).should("be.visible");
    cy.get(OnboardingLocator.introModalWelcomeTourBtn).click();
    cy.get(OnboardingLocator.welcomeTourBtn).should("be.visible");
  });

  it("onboarding flow - should check the checklist page actions", function() {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistStatus).should("be.visible");
    cy.get(OnboardingLocator.checklistStatus).should("contain", "0 of 5");
    cy.get(OnboardingLocator.checklistBack).click();

    cy.get(OnboardingLocator.statusbar).click();
    cy.get(OnboardingLocator.checklistDatasourceBtn).should("not.be.disabled");
    cy.get(OnboardingLocator.checklistDatasourceBtn).click();
    cy.get(OnboardingLocator.datasourcePage).should("be.visible");
    cy.get(OnboardingLocator.datasourceMock)
      .first()
      .click();
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
      window.open = _.noop;
    });
    cy.get(OnboardingLocator.checklistDeployBtn).should("be.visible");
    cy.get(OnboardingLocator.checklistDeployBtn).click();
    cy.get(OnboardingLocator.checklistStatus).should("contain", "5 of 5");
    cy.get(OnboardingLocator.checklistDeployBtn).should("not.exist");
    cy.window().then((window) => {
      window.open = open;
    });
  });

  it("onboarding flow - should check the tasks page actions", function() {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
    cy.get(OnboardingLocator.taskDatasourceHeader).contains(
      Cypress.env("MESSAGES").ONBOARDING_TASK_DATASOURCE_HEADER(),
    );
    cy.get(OnboardingLocator.taskDatasourceBtn).click();
    cy.get(OnboardingLocator.datasourcePage).should("be.visible");
    cy.get(OnboardingLocator.datasourceMock)
      .first()
      .click();
    cy.wait(1000);
    cy.get(OnboardingLocator.datasourceBackBtn).click();
    cy.get(OnboardingLocator.taskDatasourceBtn).should("not.exist");

    cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
    cy.get(OnboardingLocator.taskDatasourceHeader).contains(
      Cypress.env("MESSAGES").ONBOARDING_TASK_QUERY_HEADER(),
    );
    cy.get(OnboardingLocator.taskActionBtn).click();
    cy.get(OnboardingLocator.datasourcePage).should("be.visible");
    cy.get(OnboardingLocator.createQuery)
      .first()
      .click();
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
  });

  it("onboarding flow - should check the tasks page datasource action alternate widget action", function() {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
    cy.get(OnboardingLocator.taskDatasourceAltBtn).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });

  it("onboarding flow - should check the tasks page query action alternate widget action", function() {
    cy.get(OnboardingLocator.introModalBuild).click();

    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
    cy.get(OnboardingLocator.taskDatasourceBtn).click();
    cy.get(OnboardingLocator.datasourcePage).should("be.visible");
    cy.get(OnboardingLocator.datasourceMock)
      .first()
      .click();
    cy.wait(1000);
    cy.get(OnboardingLocator.datasourceBackBtn).click();

    cy.get(OnboardingLocator.taskActionBtn).should("be.visible");
    cy.get(OnboardingLocator.taskActionAltBtn).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });

  it("onboarding flow - should check directly opening widget pane", function() {
    cy.get(OnboardingLocator.introModalBuild).click();
    cy.get(OnboardingLocator.taskDatasourceBtn).should("be.visible");
    cy.get(OnboardingLocator.widgetPaneTrigger).click();
    cy.get(OnboardingLocator.widgetSidebar).should("be.visible");
    cy.get(OnboardingLocator.dropTarget).should("be.visible");
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(OnboardingLocator.textWidgetName)
      .should("be.visible")
      .wait(800);
    cy.reload();
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(OnboardingLocator.statusbar).should("be.visible");
    cy.get(OnboardingLocator.textWidgetName).should("be.visible");
  });
});
