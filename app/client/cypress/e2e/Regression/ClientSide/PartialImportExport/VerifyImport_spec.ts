import {
  agHelper,
  homePage,
  gitSync,
  appSettings,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";
import ReconnectLocators from "../../../../locators/ReconnectLocators";

describe(
  "Tests Import option for Git connected apps and normal apps",
  {},
  () => {
    before(() => {
      gitSync.CreateNConnectToGit();
    });

    it("1. Verify Import Option", () => {
      let Datasource = [
        "AWSLambda",
        "Airtable",
        "GSheets_RWDSelected",
        "GSheets_RWDAll",
        "Hubspot",
        "gsheet",
        "Twilio",
        "Dynamo",
        "ElasticSearch",
        "Firestore",
        "Movies",
        "Mongo",
        "Oracle",
        "Redshift",
        "PostGreSQL",
        "SMTP",
        "Snowflake",
        "S3",
        "Oauth2.0",
        "Pixabay",
        "OpenAI",
      ];
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._importHeader);
      agHelper.AssertElementEnabledDisabled(appSettings.locators._importBtn);

      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      AppSidebar.navigate(AppSidebarButton.Settings);
      agHelper.GetNClick(appSettings.locators._importHeader);
      agHelper.AssertElementEnabledDisabled(
        appSettings.locators._importBtn,
        0,
        false,
      );
      agHelper.GetNClick(appSettings.locators._importBtn);
      homePage.ImportApp("TryToCoverMore.json", "", true);
      agHelper.GetNClick(ReconnectLocators.SkipToAppBtn);

      AppSidebar.navigate(AppSidebarButton.Data);
      Datasource.forEach((ds) => {
        agHelper.GetNAssertContains(locators._listItemTitle, ds);
      });
    });
  },
);
