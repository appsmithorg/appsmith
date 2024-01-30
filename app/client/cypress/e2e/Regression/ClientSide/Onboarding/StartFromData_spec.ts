import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  dataSources,
  homePage,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Start with data userflow",
  { tags: ["@tag.excludeForAirgap", "@tag.Datasource"] },
  function () {
    beforeEach(() => {
      homePage.LogOutviaAPI();
      featureFlagIntercept({
        ab_show_templates_instead_of_blank_canvas_enabled: true,
        ab_create_new_apps_enabled: true,
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.SignUp(`${uid}@appsmithtest.com`, uid as unknown as string);
        onboarding.closeIntroModal();
      });
      agHelper.GetNClick(onboarding.locators.startFromDataCard);
    });

    it("1. onboarding flow - create datasource and save, it should take me to datasource page with view mode", function () {
      agHelper.Sleep(1000);
      dataSources.CreateDataSource("Postgres", false);
      dataSources.selectTabOnDatasourcePage("View data");
      agHelper.TypeText(dataSources._datasourceStructureSearchInput, "users");
      agHelper.GetNClick(
        dataSources._dsPageTabContainerTableName("public.users"),
      );
      assertHelper.AssertNetworkExecutionSuccess("@schemaPreview");
      agHelper.AssertElementAbsence(
        dataSources._dsPageTableTriggermenuTarget("public.users"),
      );
    });
  },
);
