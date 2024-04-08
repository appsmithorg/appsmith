import {
  autoLayout,
  agHelper,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../locators/HomePage";

describe(
  "Copy paste widget related tests for Auto layout",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      agHelper.Sleep(2000);
      agHelper.AddDsl("autoLayoutReflow");
    });

    it("1. Containers Should Reflow in smaller viewports", () => {
      agHelper.GetNClick(HomePage.shareApp);
      //@ts-expect-error no type access
      cy.enablePublicAccess(true);
      deployMode.DeployApp();
      autoLayout.getAutoLayoutLayerClassName("0", 0);
      agHelper.AssertCSS(
        autoLayout.getAutoLayoutLayerClassName("0", 0),
        "flex-wrap",
        "nowrap",
      );
      cy.viewport("iphone-4");
      agHelper.AssertCSS(
        autoLayout.getAutoLayoutLayerClassName("0", 0),
        "flex-wrap",
        "wrap",
      );
    });
    it("2. Auto Layout Reflow should work in public apps as well", () => {
      let currentUrl = "";
      cy.url().then((url) => {
        currentUrl = url;
        cy.log(currentUrl);
        homePage.Signout(false);
        agHelper.VisitNAssert(url, "getConsolidatedData");
        agHelper.AssertCSS(
          autoLayout.getAutoLayoutLayerClassName("0", 0),
          "flex-wrap",
          "nowrap",
        );
        cy.viewport("iphone-4");
        agHelper.AssertCSS(
          autoLayout.getAutoLayoutLayerClassName("0", 0),
          "flex-wrap",
          "wrap",
        );
      });
    });
  },
);
