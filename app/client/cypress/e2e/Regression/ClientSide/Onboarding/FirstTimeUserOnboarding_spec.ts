import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const OnboardingLocator = require("../../../../locators/FirstTimeUserOnboarding.json");
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
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
    homePage.LogOutviaAPI();
    featureFlagIntercept({
      ab_show_templates_instead_of_blank_canvas_enabled: true,
      ab_create_new_apps_enabled: true,
    });
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      homePage.SignUp(`${uid}@appsmithtest.com`, uid as unknown as string);
    });
    agHelper.GetNClick(onboarding.locators.startFromDataCard);
  });

  it("1. onboarding flow - should check directly opening widget pane", function () {
    agHelper.AssertElementVisibility(OnboardingLocator.checklistDatasourceBtn);
    agHelper.GetNClick(OnboardingLocator.introModalCloseBtn);
    PageLeftPane.switchSegment(PagePaneSegment.UI);
    agHelper.AssertElementVisibility(OnboardingLocator.widgetSidebar);
    agHelper.AssertElementVisibility(OnboardingLocator.dropTarget);
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
    agHelper.RefreshPage("getConsolidatedData");
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

  it("2. onboarding flow - new apps created should start with signposting", function () {
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

  it("3. onboarding flow - once signposting is completed new apps won't start with signposting", function () {
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
