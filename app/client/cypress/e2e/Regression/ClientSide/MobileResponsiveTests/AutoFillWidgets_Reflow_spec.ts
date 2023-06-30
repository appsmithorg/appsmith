import * as _ from "../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../locators/HomePage";

describe("Copy paste widget related tests for Auto layout", () => {
  before(() => {
    _.autoLayout.ConvertToAutoLayoutAndVerify(false);
    _.agHelper.Sleep(2000);
    cy.fixture("autoLayoutReflow").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Containers Should Reflow in smaller viewports", () => {
    cy.get(HomePage.shareApp).click();
    //@ts-expect-error no type access
    cy.enablePublicAccess(true);
    _.deployMode.DeployApp();

    _.agHelper
      .GetElement(".auto-layout-layer-0-0")
      .invoke("css", "flex-wrap")
      .should("eq", "nowrap");
    cy.viewport("iphone-4");
    _.agHelper
      .GetElement(".auto-layout-layer-0-0")
      .invoke("css", "flex-wrap")
      .should("eq", "wrap");
  });
  it("2. Auto Layout Reflow should work in public apps as well", () => {
    let currentUrl = "";
    cy.url().then((url) => {
      currentUrl = url;
      cy.log(currentUrl);
    });
    _.homePage.Signout(false).then(() => {
      cy.visit(currentUrl);
      // wait for page render
      cy.wait("@getPagesForViewApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      _.agHelper
        .GetElement(".auto-layout-layer-0-0")
        .invoke("css", "flex-wrap")
        .should("eq", "nowrap");
      cy.viewport("iphone-4");
      _.agHelper
        .GetElement(".auto-layout-layer-0-0")
        .invoke("css", "flex-wrap")
        .should("eq", "wrap");
    });
  });
});
